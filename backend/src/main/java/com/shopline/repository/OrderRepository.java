package com.shopline.repository;

import com.shopline.db.Database;
import com.shopline.db.Rows;
import com.shopline.model.Order;
import com.shopline.model.OrderItem;
import com.shopline.model.OrderStatus;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public final class OrderRepository {

    private static final String SELECT = """
            select o.id, o.customer_id, o.customer_name, u.email as customer_email, u.phone as customer_phone,
                   o.shop_id, o.shop_name, o.delivery_address, o.total, o.status, o.created_at
            from orders o
            left join users u on u.id = o.customer_id
            """;

    private final Database db;

    public OrderRepository(Database db) {
        this.db = db;
    }

    public long create(long customerId, String customerName, long shopId, String shopName,
                       String deliveryAddress, BigDecimal total) {
        return db.insert("""
                insert into orders (customer_id, customer_name, shop_id, shop_name, delivery_address, total)
                values (?, ?, ?, ?, ?, ?) returning id
                """, customerId, customerName, shopId, shopName, deliveryAddress, total);
    }

    public void addItem(long orderId, long productId, String name, BigDecimal price, int qty) {
        db.update("insert into order_items (order_id, product_id, name, price, qty) values (?, ?, ?, ?, ?)",
                orderId, productId, name, price, qty);
    }

    public Optional<Order> findById(long id) {
        return withItems(db.query(SELECT + " where o.id = ?", OrderRepository::map, id)).stream().findFirst();
    }

    public List<Order> findByIds(List<Long> ids) {
        return withItems(db.query(SELECT + " where o.id = any(?) order by o.id",
                OrderRepository::map, (Object) ids.toArray(Long[]::new)));
    }

    public List<Order> listByCustomer(long customerId) {
        return withItems(db.query(SELECT + " where o.customer_id = ? order by o.created_at desc", OrderRepository::map, customerId));
    }

    public List<Order> listByShop(long shopId) {
        return withItems(db.query(SELECT + " where o.shop_id = ? order by o.created_at desc", OrderRepository::map, shopId));
    }

    public List<Order> listAll() {
        return withItems(db.query(SELECT + " order by o.created_at desc", OrderRepository::map));
    }

    /**
     * Moves an order from one status to another. The {@code where status = from} check makes this safe
     * if two people update the same order at once: only one of them wins. Returns false if the order
     * was no longer in the expected status.
     */
    public boolean changeStatus(long orderId, OrderStatus from, OrderStatus to) {
        return db.update("update orders set status = ?, updated_at = now() where id = ? and status = ?",
                to, orderId, from) == 1;
    }

    /** Loads the line items for all the given orders with a single query. */
    private List<Order> withItems(List<Order> orders) {
        if (orders.isEmpty()) return orders;
        Map<Long, Order> byId = orders.stream().collect(Collectors.toMap(Order::id, Function.identity()));
        db.query("select order_id, product_id, name, price, qty from order_items where order_id = any(?) order by id",
                row -> {
                    byId.get(row.getLong("order_id")).items().add(new OrderItem(
                            Rows.nullableLong(row, "product_id"),
                            row.getString("name"),
                            row.getBigDecimal("price"),
                            row.getInt("qty")));
                    return null;
                },
                (Object) byId.keySet().toArray(Long[]::new));
        return orders;
    }

    private static Order map(ResultSet row) throws SQLException {
        return new Order(
                row.getLong("id"),
                Rows.nullableLong(row, "customer_id"),
                row.getString("customer_name"),
                row.getString("customer_email"),
                row.getString("customer_phone"),
                Rows.nullableLong(row, "shop_id"),
                row.getString("shop_name"),
                row.getString("delivery_address"),
                row.getBigDecimal("total"),
                OrderStatus.parse(row.getString("status")),
                Rows.timestamp(row, "created_at"),
                new ArrayList<>());
    }
}
