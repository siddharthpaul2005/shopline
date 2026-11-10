package com.shopline.model;

import java.math.BigDecimal;

/** A line in an order. Name and price are what the customer paid at checkout. */
public record OrderItem(Long productId, String name, BigDecimal price, int qty) {}
