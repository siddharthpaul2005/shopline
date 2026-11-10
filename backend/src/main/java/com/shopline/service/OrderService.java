package com.shopline.service;

import com.shopline.db.Database;
import com.shopline.dto.Requests.CartLine;
import com.shopline.dto.Requests.PlaceOrderRequest;
import com.shopline.http.ApiException;
import com.shopline.model.Order;
import com.shopline.model.OrderStatus;
import com.shopline.model.User;
import com.shopline.model.VendorStatus;
import com.shopline.repository.OrderRepository;
import com.shopline.repository.ProductRepository;
import com.shopline.repository.ProductRepository.CheckoutProduct;
import com.shopline.repository.ShopRepository;
import com.shopline.util.Validation;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Checkout and the order lifecycle. */
public final class OrderService {

    private static final int MAX_QTY_PER_ITEM = 100;
    private static final int MAX_LINES = 100;

    private final Database db;
    private final OrderRepository orders;
    private final ProductRepository products;
    private final ShopRepository shops;

    public OrderService(Database db, OrderRepository orders, ProductRepository products, ShopRepository shops) {
        this.db = db;
        this.orders = orders;
        this.products = products;
        this.shops = shops;
    }

    /**
     * Places the customer's cart. Items are split into one order per shop. Prices come from the
     * database, not the browser, and the whole checkout runs in one transaction: either every
     * order is created and all stock is reserved, or nothing changes.
     */
    public List<Order> placeOrder(User customer, PlaceOrderRequest request) {
        Map<Long, Integer> quantities = mergeCart(request.items());
        String address = request.deliveryAddress() == null || request.deliveryAddress().isBlank()
                ? customer.address()
                : request.deliveryAddress();
        String deliveryAddress = Validation.required(address, "Delivery address", 300);

        List<Long> createdIds = db.transaction(() -> {
            List<CheckoutProduct> found = products.lockForCheckout(quantities.keySet().toArray(Long[]::new));
            Map<Long, CheckoutProduct> byId = found.stream()
                    .collect(Collectors.toMap(CheckoutProduct::id, Function.identity()));

            // Validate every line before writing anything.
            for (Map.Entry<Long, Integer> line : quantities.entrySet()) {
                CheckoutProduct p = byId.get(line.getKey());
                if (p == null || !"active".equals(p.status()) || p.vendorStatus() != VendorStatus.APPROVED) {
                    throw ApiException.badRequest("Some items in your cart are no longer available. Please remove them and try again.");
                }
                if (p.stock() < line.getValue()) {
                    throw ApiException.badRequest(p.stock() == 0
                            ? p.name() + " is out of stock"
                            : "Only " + p.stock() + " left of " + p.name());
                }
            }

            // Group lines by shop (keeping cart order) and create one order per shop.
            Map<Long, List<CheckoutProduct>> byShop = new LinkedHashMap<>();
            for (Long productId : quantities.keySet()) {
                CheckoutProduct p = byId.get(productId);
                byShop.computeIfAbsent(p.shopId(), k -> new ArrayList<>()).add(p);
            }

            List<Long> ids = new ArrayList<>();
            for (List<CheckoutProduct> shopLines : byShop.values()) {
                BigDecimal total = shopLines.stream()
                        .map(p -> p.price().multiply(BigDecimal.valueOf(quantities.get(p.id()))))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                CheckoutProduct first = shopLines.get(0);
                long orderId = orders.create(customer.id(), customer.name(), first.shopId(), first.shopName(), deliveryAddress, total);
                for (CheckoutProduct p : shopLines) {
                    int qty = quantities.get(p.id());
                    orders.addItem(orderId, p.id(), p.name(), p.price(), qty);
                    products.decrementStock(p.id(), qty);
                }
                ids.add(orderId);
            }
            return ids;
        });
        return orders.findByIds(createdIds);
    }

    public List<Order> customerOrders(User customer) {
        return orders.listByCustomer(customer.id());
    }

    /** Customers can cancel an order only while the shop hasn't started on it. */
    public Order cancelByCustomer(User customer, long orderId) {
        Order order = orders.findById(orderId)
                .filter(o -> o.customerId() != null && o.customerId() == customer.id())
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (order.status() == OrderStatus.CANCELLED) {
            throw ApiException.badRequest("This order is already cancelled");
        }
        if (order.status() != OrderStatus.PENDING) {
            throw ApiException.badRequest("This order is already being prepared and can't be cancelled");
        }
        return transition(order, OrderStatus.CANCELLED);
    }

    public List<Order> vendorOrders(User vendor) {
        return shops.findByVendor(vendor.id()).map(s -> orders.listByShop(s.id())).orElse(List.of());
    }

    public Order updateStatusByVendor(User vendor, long orderId, String statusValue) {
        OrderStatus next = OrderStatus.parse(statusValue);
        if (next == null) throw ApiException.badRequest("Unknown order status");

        long shopId = shops.findByVendor(vendor.id())
                .orElseThrow(() -> ApiException.notFound("Order not found")).id();
        Order order = orders.findById(orderId)
                .filter(o -> o.shopId() != null && o.shopId() == shopId)
                .orElseThrow(() -> ApiException.notFound("Order not found"));
        if (!order.status().canMoveTo(next)) {
            throw ApiException.badRequest("Can't change an order from " + order.status().value() + " to " + next.value());
        }
        return transition(order, next);
    }

    public List<Order> allOrders() {
        return orders.listAll();
    }

    /** Changes the status and, when cancelling, returns the items to stock, all in one transaction. */
    private Order transition(Order order, OrderStatus next) {
        db.transaction(() -> {
            if (!orders.changeStatus(order.id(), order.status(), next)) {
                throw ApiException.conflict("This order was just updated by someone else. Please refresh.");
            }
            if (next == OrderStatus.CANCELLED) {
                products.restoreStockForOrder(order.id());
            }
            return null;
        });
        return orders.findById(order.id()).orElseThrow();
    }

    /** Validates cart lines and merges duplicates of the same product. */
    static Map<Long, Integer> mergeCart(List<CartLine> lines) {
        if (lines == null || lines.isEmpty()) throw ApiException.badRequest("Your cart is empty");
        if (lines.size() > MAX_LINES) throw ApiException.badRequest("Too many items in one order");
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (CartLine line : lines) {
            if (line == null || line.productId() == null || line.qty() == null || line.qty() < 1) {
                throw ApiException.badRequest("Each cart item needs a product and a quantity of at least 1");
            }
            int total = quantities.merge(line.productId(), line.qty(), Integer::sum);
            if (total > MAX_QTY_PER_ITEM) {
                throw ApiException.badRequest("You can order at most " + MAX_QTY_PER_ITEM + " of one item");
            }
        }
        return quantities;
    }
}
