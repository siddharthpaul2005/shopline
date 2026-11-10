package com.shopline.repository;

import com.shopline.db.Database;
import com.shopline.db.Rows;
import com.shopline.dto.Requests.ShopRequest;
import com.shopline.model.Shop;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public final class ShopRepository {

    private static final String SELECT = """
            select s.id, s.vendor_id, s.name, s.description, s.category, s.address, s.phone, s.image, s.created_at,
                   (select count(*) from products p where p.shop_id = s.id and p.status = 'active') as product_count
            from shops s
            """;

    /** Customers only see shops whose owner has been approved by an admin. */
    private static final String APPROVED = " join users u on u.id = s.vendor_id and u.vendor_status = 'approved' ";

    private final Database db;

    public ShopRepository(Database db) {
        this.db = db;
    }

    public Optional<Shop> findByVendor(long vendorId) {
        return db.queryOne(SELECT + " where s.vendor_id = ?", ShopRepository::map, vendorId);
    }

    public Optional<Shop> findApprovedById(long id) {
        return db.queryOne(SELECT + APPROVED + " where s.id = ?", ShopRepository::map, id);
    }

    public List<Shop> listApproved() {
        return db.query(SELECT + APPROVED + " order by s.created_at desc", ShopRepository::map);
    }

    public Shop create(long vendorId, ShopRequest shop) {
        db.insert("""
                insert into shops (vendor_id, name, description, category, address, phone, image)
                values (?, ?, ?, ?, ?, ?, ?) returning id
                """,
                vendorId, shop.name(), shop.description(), shop.category(), shop.address(), shop.phone(), shop.image());
        return findByVendor(vendorId).orElseThrow();
    }

    public Shop update(long vendorId, ShopRequest shop) {
        db.update("""
                update shops set name = ?, description = ?, category = ?, address = ?, phone = ?, image = ?, updated_at = now()
                where vendor_id = ?
                """,
                shop.name(), shop.description(), shop.category(), shop.address(), shop.phone(), shop.image(), vendorId);
        return findByVendor(vendorId).orElseThrow();
    }

    private static Shop map(ResultSet row) throws SQLException {
        return new Shop(
                row.getLong("id"),
                row.getLong("vendor_id"),
                row.getString("name"),
                row.getString("description"),
                row.getString("category"),
                row.getString("address"),
                row.getString("phone"),
                row.getString("image"),
                row.getInt("product_count"),
                Rows.timestamp(row, "created_at"));
    }
}
