package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/** A vendor's storefront. {@code products} is the number of active products. */
public record Shop(
        @JsonProperty("_id") long id,
        long vendorId,
        String name,
        String description,
        String category,
        String address,
        String phone,
        String image,
        int products,
        String createdAt
) {}
