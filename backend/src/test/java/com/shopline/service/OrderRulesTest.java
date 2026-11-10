package com.shopline.service;

import com.shopline.dto.Requests.CartLine;
import com.shopline.http.ApiException;
import com.shopline.model.OrderStatus;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static com.shopline.model.OrderStatus.CANCELLED;
import static com.shopline.model.OrderStatus.DELIVERED;
import static com.shopline.model.OrderStatus.PENDING;
import static com.shopline.model.OrderStatus.PROCESSING;
import static com.shopline.model.OrderStatus.SHIPPED;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderRulesTest {

    @Test
    void ordersMoveForwardThroughTheLifecycle() {
        assertTrue(PENDING.canMoveTo(PROCESSING));
        assertTrue(PROCESSING.canMoveTo(SHIPPED));
        assertTrue(SHIPPED.canMoveTo(DELIVERED));
    }

    @Test
    void ordersCanBeCancelledOnlyBeforeShipping() {
        assertTrue(PENDING.canMoveTo(CANCELLED));
        assertTrue(PROCESSING.canMoveTo(CANCELLED));
        assertFalse(SHIPPED.canMoveTo(CANCELLED));
    }

    @Test
    void finishedOrdersAreFinal() {
        for (OrderStatus next : OrderStatus.values()) {
            assertFalse(DELIVERED.canMoveTo(next));
            assertFalse(CANCELLED.canMoveTo(next));
        }
    }

    @Test
    void ordersCannotSkipOrGoBack() {
        assertFalse(PENDING.canMoveTo(DELIVERED));
        assertFalse(SHIPPED.canMoveTo(PENDING));
    }

    @Test
    void cartMergesDuplicateProducts() {
        Map<Long, Integer> merged = OrderService.mergeCart(List.of(
                new CartLine(1L, 2), new CartLine(2L, 1), new CartLine(1L, 3)));
        assertEquals(Map.of(1L, 5, 2L, 1), merged);
    }

    @Test
    void cartRejectsBadLines() {
        assertThrows(ApiException.class, () -> OrderService.mergeCart(List.of()));
        assertThrows(ApiException.class, () -> OrderService.mergeCart(null));
        assertThrows(ApiException.class, () -> OrderService.mergeCart(List.of(new CartLine(1L, 0))));
        assertThrows(ApiException.class, () -> OrderService.mergeCart(List.of(new CartLine(null, 1))));
        assertThrows(ApiException.class, () -> OrderService.mergeCart(List.of(new CartLine(1L, 60), new CartLine(1L, 60))));
    }
}
