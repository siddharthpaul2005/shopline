package com.shopline.util;

import com.shopline.http.ApiException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.regex.Pattern;

/** Input checks shared by the services. Each method returns the cleaned value or throws a 400. */
public final class Validation {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private Validation() {}

    /** Trims the value; fails if it is missing, blank or longer than {@code max}. */
    public static String required(String value, String field, int max) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) throw ApiException.badRequest(field + " is required");
        if (trimmed.length() > max) throw ApiException.badRequest(field + " must be at most " + max + " characters");
        return trimmed;
    }

    /** Trims the value, turning null into an empty string; fails if longer than {@code max}. */
    public static String optional(String value, String field, int max) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.length() > max) throw ApiException.badRequest(field + " must be at most " + max + " characters");
        return trimmed;
    }

    public static String email(String value) {
        String email = required(value, "Email", 255).toLowerCase();
        if (!EMAIL.matcher(email).matches()) throw ApiException.badRequest("Please enter a valid email address");
        return email;
    }

    public static String password(String value, String field) {
        if (value == null || value.length() < 6) throw ApiException.badRequest(field + " must be at least 6 characters");
        if (value.length() > 128) throw ApiException.badRequest(field + " must be at most 128 characters");
        return value;
    }

    /** Optional image URL; must be http(s) so it can't be used to inject javascript: links. */
    public static String imageUrl(String value) {
        String url = optional(value, "Image URL", 500);
        if (!url.isEmpty() && !(url.startsWith("https://") || url.startsWith("http://"))) {
            throw ApiException.badRequest("Image URL must start with http:// or https://");
        }
        return url;
    }

    public static BigDecimal price(BigDecimal value) {
        if (value == null) throw ApiException.badRequest("Price is required");
        if (value.signum() < 0) throw ApiException.badRequest("Price can't be negative");
        if (value.compareTo(new BigDecimal("99999999.99")) > 0) throw ApiException.badRequest("Price is too large");
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public static int stock(Integer value) {
        if (value == null) return 0;
        if (value < 0) throw ApiException.badRequest("Stock can't be negative");
        if (value > 1_000_000) throw ApiException.badRequest("Stock is too large");
        return value;
    }
}
