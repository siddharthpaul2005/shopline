package com.shopline.controller;

import com.shopline.dto.Requests.PlaceOrderRequest;
import com.shopline.dto.Requests.ProfileRequest;
import com.shopline.http.Response;
import com.shopline.http.Router;
import com.shopline.service.AuthService;
import com.shopline.service.OrderService;
import com.shopline.service.ShopService;

import static com.shopline.model.Role.CUSTOMER;

/** Shop browsing (public) plus checkout, orders and profile (customers only). */
public final class CustomerController {

    private final ShopService shops;
    private final OrderService orders;
    private final AuthService auth;

    public CustomerController(ShopService shops, OrderService orders, AuthService auth) {
        this.shops = shops;
        this.orders = orders;
        this.auth = auth;
    }

    public void register(Router router) {
        // Browsing is public, so the storefront could later be shown to visitors who aren't signed in.
        router.get("/api/shops", req -> shops.listShops());
        router.get("/api/shops/:id", req -> shops.getShop(req.id("id")));
        router.get("/api/shops/:id/products", req -> shops.getShopProducts(req.id("id")));

        router.post("/api/orders", req -> Response.created(orders.placeOrder(req.user(), req.body(PlaceOrderRequest.class))), CUSTOMER);
        router.get("/api/customer/orders", req -> orders.customerOrders(req.user()), CUSTOMER);
        router.put("/api/customer/orders/:id/cancel", req -> orders.cancelByCustomer(req.user(), req.id("id")), CUSTOMER);

        router.get("/api/customer/profile", req -> req.user(), CUSTOMER);
        router.put("/api/customer/profile", req -> auth.updateProfile(req.user(), req.body(ProfileRequest.class)), CUSTOMER);
    }
}
