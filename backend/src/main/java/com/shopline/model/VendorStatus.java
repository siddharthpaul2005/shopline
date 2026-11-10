package com.shopline.model;

import com.fasterxml.jackson.annotation.JsonValue;

/** Approval state of a vendor account. Only approved vendors' shops are visible to customers. */
public enum VendorStatus {
    PENDING, APPROVED, REJECTED;

    @JsonValue
    public String value() {
        return name().toLowerCase();
    }

    public static VendorStatus parse(String value) {
        if (value == null) return null;
        for (VendorStatus status : values()) {
            if (status.value().equalsIgnoreCase(value.trim())) return status;
        }
        return null;
    }
}
