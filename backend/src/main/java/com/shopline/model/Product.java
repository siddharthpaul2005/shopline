package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record Product(
        @JsonProperty("_id") long id,
        long shopId,
        String name,
        String description,
        String category,
        String image,
        BigDecimal price,
        int stock,
        String status,
        String createdAt
) {}
