package com.shopline.dto;

import com.shopline.model.User;

import java.math.BigDecimal;
import java.util.List;

/**
 * JSON request and response bodies. Fields are nullable on purpose: anything missing from the
 * JSON arrives as null and is checked by the service layer, which returns a readable 400 error.
 */
public final class Requests {
    private Requests() {}

    public record RegisterRequest(String name, String email, String password, String role) {}

    public record LoginRequest(String email, String password) {}

    public record AuthResponse(String token, User user) {}

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    public record ProfileRequest(String name, String email, String phone, String address) {}

    public record ShopRequest(String name, String description, String category, String address, String phone, String image) {}

    public record ProductRequest(String name, String description, String category, String image,
                                 BigDecimal price, Integer stock, String status) {}

    public record CartLine(Long productId, Integer qty) {}

    public record PlaceOrderRequest(List<CartLine> items, String deliveryAddress) {}

    public record StatusRequest(String status) {}
}
