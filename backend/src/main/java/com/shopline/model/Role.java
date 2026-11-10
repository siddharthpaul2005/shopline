package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    ADMIN, VENDOR, CUSTOMER;

    /** Sent to the frontend and stored in the database as lowercase: "admin", "vendor", "customer". */
    @JsonValue
    public String value() {
        return name().toLowerCase();
    }

    /** Returns null for unknown values. */
    public static Role parse(String value) {
        if (value == null) return null;
        for (Role role : values()) {
            if (role.value().equalsIgnoreCase(value.trim())) return role;
        }
        return null;
    }
}
