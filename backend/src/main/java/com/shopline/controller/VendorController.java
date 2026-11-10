package com.shopline.controller;

import com.shopline.dto.Requests.ProductRequest;
import com.shopline.dto.Requests.ShopRequest;
import com.shopline.dto.Requests.StatusRequest;
import com.shopline.http.Response;
import com.shopline.http.Router;
import com.shopline.service.AdminService;
import com.shopline.service.OrderService;
import com.shopline.service.ShopService;

import static com.shopline.model.Role.VENDOR;

/** /api/vendor/* — a vendor manages their own shop, products and incoming orders. */
public final class VendorController {

    private final ShopService shops;
    private final OrderService orders;
    private final AdminService stats;

    public VendorController(ShopService shops, OrderService orders, AdminService stats) {
        this.shops = shops;
        this.orders = orders;
        this.stats = stats;
    }

    public void register(Router router) {
        router.get("/api/vendor/stats", req -> stats.vendorStats(req.user()), VENDOR);

        router.get("/api/vendor/shop", req -> shops.myShop(req.user()), VENDOR);
        router.post("/api/vendor/shop", req -> Response.created(shops.createShop(req.user(), req.body(ShopRequest.class))), VENDOR);
        router.put("/api/vendor/shop", req -> shops.updateShop(req.user(), req.body(ShopRequest.class)), VENDOR);

        router.get("/api/vendor/products", req -> shops.myProducts(req.user()), VENDOR);
        router.post("/api/vendor/products", req -> Response.created(shops.createProduct(req.user(), req.body(ProductRequest.class))), VENDOR);
        router.put("/api/vendor/products/:id", req -> shops.updateProduct(req.user(), req.id("id"), req.body(ProductRequest.class)), VENDOR);
        router.delete("/api/vendor/products/:id", req -> {
            shops.deleteProduct(req.user(), req.id("id"));
            return Response.noContent();
        }, VENDOR);

        router.get("/api/vendor/orders", req -> orders.vendorOrders(req.user()), VENDOR);
        router.put("/api/vendor/orders/:id/status",
                req -> orders.updateStatusByVendor(req.user(), req.id("id"), req.body(StatusRequest.class).status()), VENDOR);
    }
}
