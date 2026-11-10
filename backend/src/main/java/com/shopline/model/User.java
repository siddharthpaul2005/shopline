package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

public record User(
        @JsonProperty("_id") long id,
        String name,
        String email,
        @JsonIgnore String passwordHash,
        Role role,
        @JsonInclude(JsonInclude.Include.NON_NULL) VendorStatus vendorStatus,
        String phone,
        String address,
        String createdAt
) {}
