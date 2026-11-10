package com.shopline.service;

import com.shopline.http.ApiException;
import com.shopline.model.Role;
import com.shopline.model.Shop;
import com.shopline.model.User;
import com.shopline.model.VendorStatus;
import com.shopline.model.Views.AdminStats;
import com.shopline.model.Views.UserSummary;
import com.shopline.model.Views.VendorStats;
import com.shopline.model.Views.VendorSummary;
import com.shopline.repository.ShopRepository;
import com.shopline.repository.StatsRepository;
import com.shopline.repository.StatsRepository.ShopNumbers;
import com.shopline.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Admin tools (users, vendor approval) and the dashboard numbers. */
public final class AdminService {

    private final UserRepository users;
    private final ShopRepository shops;
    private final StatsRepository stats;

    public AdminService(UserRepository users, ShopRepository shops, StatsRepository stats) {
        this.users = users;
        this.shops = shops;
        this.stats = stats;
    }

    public AdminStats adminStats() {
        return stats.adminStats();
    }

    public VendorStats vendorStats(User vendor) {
        Optional<Shop> shop = shops.findByVendor(vendor.id());
        ShopNumbers numbers = shop.map(s -> stats.shopNumbers(s.id()))
                .orElse(new ShopNumbers(0, 0, 0, BigDecimal.ZERO));
        return new VendorStats(
                shop.isPresent(),
                shop.map(Shop::name).orElse(null),
                vendor.vendorStatus(),
                numbers.products(),
                numbers.orders(),
                numbers.pendingOrders(),
                numbers.revenue());
    }

    public List<VendorSummary> vendors() {
        return users.listVendors();
    }

    public Map<String, Object> setVendorStatus(long vendorId, VendorStatus status) {
        if (!users.setVendorStatus(vendorId, status)) {
            throw ApiException.notFound("Vendor not found");
        }
        return Map.of("_id", vendorId, "status", status);
    }

    public List<UserSummary> users() {
        return users.listWithOrderCounts();
    }

    public void deleteUser(User admin, long userId) {
        User target = users.findById(userId).orElseThrow(() -> ApiException.notFound("User not found"));
        if (target.id() == admin.id()) {
            throw ApiException.badRequest("You can't delete your own account");
        }
        if (target.role() == Role.ADMIN) {
            throw ApiException.forbidden("Admin accounts can't be deleted from the dashboard");
        }
        users.delete(userId);
    }
}
