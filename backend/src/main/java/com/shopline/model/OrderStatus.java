package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Order lifecycle:
 * <pre>
 *   pending ──► processing ──► shipped ──► delivered
 *      │             │
 *      └──► cancelled ◄┘
 * </pre>
 * Delivered and cancelled are final.
 */
public enum OrderStatus {
    PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED;

    @JsonValue
    public String value() {
        return name().toLowerCase();
    }

    public static OrderStatus parse(String value) {
        if (value == null) return null;
        for (OrderStatus status : values()) {
            if (status.value().equalsIgnoreCase(value.trim())) return status;
        }
        return null;
    }

    public boolean canMoveTo(OrderStatus next) {
        return switch (this) {
            case PENDING -> next == PROCESSING || next == CANCELLED;
            case PROCESSING -> next == SHIPPED || next == CANCELLED;
            case SHIPPED -> next == DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }
}
