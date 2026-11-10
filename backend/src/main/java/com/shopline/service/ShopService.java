package com.shopline.service;

import com.shopline.dto.Requests.ProductRequest;
import com.shopline.dto.Requests.ShopRequest;
import com.shopline.http.ApiException;
import com.shopline.model.Product;
import com.shopline.model.Shop;
import com.shopline.model.User;
import com.shopline.repository.ProductRepository;
import com.shopline.repository.ShopRepository;
import com.shopline.util.Validation;

import java.util.List;
import java.util.Optional;

/** Shops and products: public browsing for customers, and management for vendors. */
public final class ShopService {

    private final ShopRepository shops;
    private final ProductRepository products;

    public ShopService(ShopRepository shops, ProductRepository products) {
        this.shops = shops;
        this.products = products;
    }

    // ---- Public (customer) side ----

    public List<Shop> listShops() {
        return shops.listApproved();
    }

    public Shop getShop(long shopId) {
        return shops.findApprovedById(shopId).orElseThrow(() -> ApiException.notFound("Shop not found"));
    }

    public List<Product> getShopProducts(long shopId) {
        getShop(shopId); // 404 if the shop doesn't exist or isn't approved
        return products.listByShop(shopId, true);
    }

    // ---- Vendor side ----

    /** The vendor's shop, or null if they haven't created one yet. */
    public Shop myShop(User vendor) {
        return shops.findByVendor(vendor.id()).orElse(null);
    }

    public Optional<Shop> findMyShop(User vendor) {
        return shops.findByVendor(vendor.id());
    }

    public Shop createShop(User vendor, ShopRequest request) {
        if (shops.findByVendor(vendor.id()).isPresent()) {
            throw ApiException.conflict("You already have a shop");
        }
        return shops.create(vendor.id(), clean(request));
    }

    public Shop updateShop(User vendor, ShopRequest request) {
        requireShop(vendor);
        return shops.update(vendor.id(), clean(request));
    }

    public List<Product> myProducts(User vendor) {
        return findMyShop(vendor).map(s -> products.listByShop(s.id(), false)).orElse(List.of());
    }

    public Product createProduct(User vendor, ProductRequest request) {
        Shop shop = requireShop(vendor);
        return products.create(shop.id(), clean(request));
    }

    public Product updateProduct(User vendor, long productId, ProductRequest request) {
        Shop shop = requireShop(vendor);
        return products.update(productId, shop.id(), clean(request))
                .orElseThrow(() -> ApiException.notFound("Product not found"));
    }

    public void deleteProduct(User vendor, long productId) {
        Shop shop = requireShop(vendor);
        if (!products.delete(productId, shop.id())) {
            throw ApiException.notFound("Product not found");
        }
    }

    private Shop requireShop(User vendor) {
        return shops.findByVendor(vendor.id())
                .orElseThrow(() -> ApiException.badRequest("Set up your shop first (My Shop page)"));
    }

    private static ShopRequest clean(ShopRequest r) {
        return new ShopRequest(
                Validation.required(r.name(), "Shop name", 100),
                Validation.optional(r.description(), "Description", 1000),
                Validation.optional(r.category(), "Category", 50),
                Validation.optional(r.address(), "Address", 300),
                Validation.optional(r.phone(), "Phone", 30),
                Validation.imageUrl(r.image()));
    }

    private static ProductRequest clean(ProductRequest r) {
        String status = r.status() == null || r.status().isBlank() ? "active" : r.status().trim().toLowerCase();
        if (!status.equals("active") && !status.equals("inactive")) {
            throw ApiException.badRequest("Status must be active or inactive");
        }
        return new ProductRequest(
                Validation.required(r.name(), "Product name", 120),
                Validation.optional(r.description(), "Description", 1000),
                Validation.optional(r.category(), "Category", 50),
                Validation.imageUrl(r.image()),
                Validation.price(r.price()),
                Validation.stock(r.stock()),
                status);
    }
}
