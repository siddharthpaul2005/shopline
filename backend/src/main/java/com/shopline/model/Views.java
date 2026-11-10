package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/** Read-only shapes used by the admin and vendor dashboards. */
public final class Views {
    private Views() {}

    /** A row in the admin "Users" table. */
    public record UserSummary(
            @JsonProperty("_id") long id,
            String name,
            String email,
            Role role,
            long orders,
            String createdAt
    ) {}

    /** A row in the admin "Vendors" table. {@code name} is the shop name, or the owner's name if no shop exists yet. */
    public record VendorSummary(
            @JsonProperty("_id") long id,
            String name,
            String owner,
            String email,
            VendorStatus status,
            boolean hasShop,
            long products,
            String createdAt
    ) {}

    public record AdminStats(
            long users,
            long vendors,
            long pendingVendors,
            long orders,
            long pendingOrders,
            BigDecimal revenue
    ) {}

    public record VendorStats(
            boolean hasShop,
            String shopName,
            VendorStatus vendorStatus,
            long products,
            long orders,
            long pendingOrders,
            BigDecimal revenue
    ) {}
}
