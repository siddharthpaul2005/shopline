package com.shopline.controller;

import com.shopline.http.Response;
import com.shopline.http.Router;
import com.shopline.model.VendorStatus;
import com.shopline.service.AdminService;
import com.shopline.service.OrderService;

import static com.shopline.model.Role.ADMIN;

/** /api/admin/* — marketplace-wide management. */
public final class AdminController {

    private final AdminService admin;
    private final OrderService orders;

    public AdminController(AdminService admin, OrderService orders) {
        this.admin = admin;
        this.orders = orders;
    }

    public void register(Router router) {
        router.get("/api/admin/stats", req -> admin.adminStats(), ADMIN);

        router.get("/api/admin/vendors", req -> admin.vendors(), ADMIN);
        router.put("/api/admin/vendors/:id/approve", req -> admin.setVendorStatus(req.id("id"), VendorStatus.APPROVED), ADMIN);
        router.put("/api/admin/vendors/:id/reject", req -> admin.setVendorStatus(req.id("id"), VendorStatus.REJECTED), ADMIN);

        router.get("/api/admin/users", req -> admin.users(), ADMIN);
        router.delete("/api/admin/users/:id", req -> {
            admin.deleteUser(req.user(), req.id("id"));
            return Response.noContent();
        }, ADMIN);

        router.get("/api/admin/orders", req -> orders.allOrders(), ADMIN);
    }
}
