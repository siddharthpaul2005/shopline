package com.shopline.repository;

import com.shopline.db.Database;
import com.shopline.db.Rows;
import com.shopline.model.Role;
import com.shopline.model.User;
import com.shopline.model.VendorStatus;
import com.shopline.model.Views.UserSummary;
import com.shopline.model.Views.VendorSummary;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public final class UserRepository {

    private static final String COLUMNS =
            "id, name, email, password_hash, role, vendor_status, phone, address, created_at";

    private final Database db;

    public UserRepository(Database db) {
        this.db = db;
    }

    public Optional<User> findById(long id) {
        return db.queryOne("select " + COLUMNS + " from users where id = ?", UserRepository::map, id);
    }

    public Optional<User> findByEmail(String email) {
        return db.queryOne("select " + COLUMNS + " from users where email = ?", UserRepository::map, email);
    }

    public User create(String name, String email, String passwordHash, Role role, VendorStatus vendorStatus) {
        return db.queryOne(
                "insert into users (name, email, password_hash, role, vendor_status) values (?, ?, ?, ?, ?) returning " + COLUMNS,
                UserRepository::map, name, email, passwordHash, role, vendorStatus).orElseThrow();
    }

    public User updateProfile(long id, String name, String email, String phone, String address) {
        return db.queryOne(
                "update users set name = ?, email = ?, phone = ?, address = ? where id = ? returning " + COLUMNS,
                UserRepository::map, name, email, phone, address, id).orElseThrow();
    }

    public void updatePassword(long id, String passwordHash) {
        db.update("update users set password_hash = ? where id = ?", passwordHash, id);
    }

    public int delete(long id) {
        return db.update("delete from users where id = ?", id);
    }

    public List<UserSummary> listWithOrderCounts() {
        return db.query("""
                select u.id, u.name, u.email, u.role, u.created_at,
                       (select count(*) from orders o where o.customer_id = u.id) as order_count
                from users u
                order by u.created_at desc
                """,
                row -> new UserSummary(
                        row.getLong("id"),
                        row.getString("name"),
                        row.getString("email"),
                        Role.parse(row.getString("role")),
                        row.getLong("order_count"),
                        Rows.timestamp(row, "created_at")));
    }

    public List<VendorSummary> listVendors() {
        return db.query("""
                select u.id, u.name as owner, u.email, u.vendor_status, u.created_at,
                       s.name as shop_name,
                       (select count(*) from products p where p.shop_id = s.id) as product_count
                from users u
                left join shops s on s.vendor_id = u.id
                where u.role = 'vendor'
                order by u.created_at desc
                """,
                row -> {
                    String shopName = row.getString("shop_name");
                    return new VendorSummary(
                            row.getLong("id"),
                            shopName != null ? shopName : row.getString("owner"),
                            row.getString("owner"),
                            row.getString("email"),
                            VendorStatus.parse(row.getString("vendor_status")),
                            shopName != null,
                            row.getLong("product_count"),
                            Rows.timestamp(row, "created_at"));
                });
    }

    /** Returns false if no vendor with that id exists. */
    public boolean setVendorStatus(long vendorId, VendorStatus status) {
        return db.update("update users set vendor_status = ? where id = ? and role = 'vendor'", status, vendorId) == 1;
    }

    private static User map(ResultSet row) throws SQLException {
        return new User(
                row.getLong("id"),
                row.getString("name"),
                row.getString("email"),
                row.getString("password_hash"),
                Role.parse(row.getString("role")),
                VendorStatus.parse(row.getString("vendor_status")),
                row.getString("phone"),
                row.getString("address"),
                Rows.timestamp(row, "created_at"));
    }
}
