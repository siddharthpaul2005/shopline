package com.shopline.repository;

import com.shopline.db.Database;
import com.shopline.db.Rows;
import com.shopline.dto.Requests.ProductRequest;
import com.shopline.model.Product;
import com.shopline.model.VendorStatus;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

public final class ProductRepository {

    private static final String COLUMNS =
            "id, shop_id, name, description, category, image, price, stock, status, created_at";

    /** What checkout needs to know about a product, read with a row lock. */
    public record CheckoutProduct(long id, long shopId, String shopName, String name, BigDecimal price,
                                  int stock, String status, VendorStatus vendorStatus) {}

    private final Database db;

    public ProductRepository(Database db) {
        this.db = db;
    }

    public List<Product> listByShop(long shopId, boolean activeOnly) {
        String filter = activeOnly ? " and status = 'active'" : "";
        return db.query("select " + COLUMNS + " from products where shop_id = ?" + filter + " order by name",
                ProductRepository::map, shopId);
    }

    public Product create(long shopId, ProductRequest p) {
        return db.queryOne("""
                insert into products (shop_id, name, description, category, image, price, stock, status)
                values (?, ?, ?, ?, ?, ?, ?, ?) returning\s""" + COLUMNS,
                ProductRepository::map,
                shopId, p.name(), p.description(), p.category(), p.image(), p.price(), p.stock(), p.status()).orElseThrow();
    }

    /** Updates a product only if it belongs to the given shop. */
    public Optional<Product> update(long id, long shopId, ProductRequest p) {
        return db.queryOne("""
                update products
                set name = ?, description = ?, category = ?, image = ?, price = ?, stock = ?, status = ?, updated_at = now()
                where id = ? and shop_id = ?
                returning\s""" + COLUMNS,
                ProductRepository::map,
                p.name(), p.description(), p.category(), p.image(), p.price(), p.stock(), p.status(), id, shopId);
    }

    /** Deletes a product only if it belongs to the given shop. */
    public boolean delete(long id, long shopId) {
        return db.update("delete from products where id = ? and shop_id = ?", id, shopId) == 1;
    }

    /**
     * Loads products for checkout and locks their rows ({@code for update}) until the transaction ends,
     * so two customers can't buy the last item at the same time. Rows are locked in id order to avoid deadlocks.
     */
    public List<CheckoutProduct> lockForCheckout(Long[] ids) {
        return db.query("""
                select p.id, p.shop_id, s.name as shop_name, p.name, p.price, p.stock, p.status, u.vendor_status
                from products p
                join shops s on s.id = p.shop_id
                join users u on u.id = s.vendor_id
                where p.id = any(?)
                order by p.id
                for update of p
                """,
                row -> new CheckoutProduct(
                        row.getLong("id"),
                        row.getLong("shop_id"),
                        row.getString("shop_name"),
                        row.getString("name"),
                        row.getBigDecimal("price"),
                        row.getInt("stock"),
                        row.getString("status"),
                        VendorStatus.parse(row.getString("vendor_status"))),
                (Object) ids);
    }

    public void decrementStock(long productId, int qty) {
        int updated = db.update("update products set stock = stock - ? where id = ? and stock >= ?", qty, productId, qty);
        if (updated != 1) throw new IllegalStateException("Stock changed during checkout for product " + productId);
    }

    /** Puts the items of a cancelled order back into stock (skipping products that were deleted since). */
    public void restoreStockForOrder(long orderId) {
        db.update("""
                update products p set stock = p.stock + oi.qty, updated_at = now()
                from order_items oi
                where oi.order_id = ? and oi.product_id = p.id
                """, orderId);
    }

    private static Product map(ResultSet row) throws SQLException {
        return new Product(
                row.getLong("id"),
                row.getLong("shop_id"),
                row.getString("name"),
                row.getString("description"),
                row.getString("category"),
                row.getString("image"),
                row.getBigDecimal("price"),
                row.getInt("stock"),
                row.getString("status"),
                Rows.timestamp(row, "created_at"));
    }
}
