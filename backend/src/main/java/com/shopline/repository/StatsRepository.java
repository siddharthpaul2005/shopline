package com.shopline.repository;

import com.shopline.db.Database;
import com.shopline.model.Views.AdminStats;

import java.math.BigDecimal;

/** Aggregate numbers for the dashboards. Revenue counts every order that wasn't cancelled. */
public final class StatsRepository {

    /** Per-shop numbers; the vendor dashboard adds the shop/approval details. */
    public record ShopNumbers(long products, long orders, long pendingOrders, BigDecimal revenue) {}

    private final Database db;

    public StatsRepository(Database db) {
        this.db = db;
    }

    public AdminStats adminStats() {
        return db.queryOne("""
                select (select count(*) from users) as users,
                       (select count(*) from users where role = 'vendor' and vendor_status = 'approved') as vendors,
                       (select count(*) from users where role = 'vendor' and vendor_status = 'pending') as pending_vendors,
                       (select count(*) from orders) as orders,
                       (select count(*) from orders where status = 'pending') as pending_orders,
                       (select coalesce(sum(total), 0) from orders where status <> 'cancelled') as revenue
                """,
                row -> new AdminStats(
                        row.getLong("users"),
                        row.getLong("vendors"),
                        row.getLong("pending_vendors"),
                        row.getLong("orders"),
                        row.getLong("pending_orders"),
                        row.getBigDecimal("revenue"))).orElseThrow();
    }

    public ShopNumbers shopNumbers(long shopId) {
        return db.queryOne("""
                select (select count(*) from products where shop_id = ?) as products,
                       (select count(*) from orders where shop_id = ?) as orders,
                       (select count(*) from orders where shop_id = ? and status = 'pending') as pending_orders,
                       (select coalesce(sum(total), 0) from orders where shop_id = ? and status <> 'cancelled') as revenue
                """,
                row -> new ShopNumbers(
                        row.getLong("products"),
                        row.getLong("orders"),
                        row.getLong("pending_orders"),
                        row.getBigDecimal("revenue")),
                shopId, shopId, shopId, shopId).orElseThrow();
    }
}
