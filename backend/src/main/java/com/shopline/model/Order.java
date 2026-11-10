package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

/**
 * An order placed with a single shop.
 * {@code customer} and {@code shop} are display names; the ids are null if the account was deleted.
 */
public record Order(
        @JsonProperty("_id") long id,
        Long customerId,
        String customer,
        String customerEmail,
        String customerPhone,
        Long shopId,
        String shop,
        String deliveryAddress,
        BigDecimal total,
        OrderStatus status,
        String createdAt,
        List<OrderItem> items
) {}
