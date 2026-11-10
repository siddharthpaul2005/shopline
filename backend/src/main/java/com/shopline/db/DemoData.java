package com.shopline.db;

import com.shopline.dto.Requests.CartLine;
import com.shopline.dto.Requests.PlaceOrderRequest;
import com.shopline.dto.Requests.ProductRequest;
import com.shopline.dto.Requests.ProfileRequest;
import com.shopline.dto.Requests.RegisterRequest;
import com.shopline.dto.Requests.ShopRequest;
import com.shopline.model.Order;
import com.shopline.model.Product;
import com.shopline.model.User;
import com.shopline.model.VendorStatus;
import com.shopline.repository.UserRepository;
import com.shopline.service.AdminService;
import com.shopline.service.AuthService;
import com.shopline.service.OrderService;
import com.shopline.service.ShopService;
import com.shopline.util.Log;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Fills an empty database with sample shops, products and orders so the app can be demoed
 * straight away. Enabled with SEED_DEMO_DATA=true and runs only once. It goes through the
 * normal services, so demo data obeys the same rules as real data.
 */
public final class DemoData {

    public static final String PASSWORD = "demo1234";
    public static final String CUSTOMER_EMAIL = "customer@shopline.test";
    public static final String VENDOR_EMAIL = "vendor@shopline.test";

    private record SeedProduct(String name, String category, String price, int stock, String description) {}

    private final UserRepository users;
    private final AuthService auth;
    private final AdminService admin;
    private final ShopService shops;
    private final OrderService orders;

    public DemoData(UserRepository users, AuthService auth, AdminService admin, ShopService shops, OrderService orders) {
        this.users = users;
        this.auth = auth;
        this.admin = admin;
        this.shops = shops;
        this.orders = orders;
    }

    public void seedIfEmpty() {
        if (users.findByEmail(CUSTOMER_EMAIL).isPresent()) {
            return;
        }
        Log.info("Seeding demo data...");

        List<Product> greenValley = vendorWithShop("Maya Patel", VENDOR_EMAIL, true,
                new ShopRequest("Green Valley Farms", "Organic fruit and vegetables picked the morning they're delivered.",
                        "Organic", "12 Orchard Lane", "+1 555 0101", ""),
                List.of(
                        new SeedProduct("Organic Apples (1kg)", "Fruits", "3.99", 120, "Crisp, sweet Gala apples"),
                        new SeedProduct("Organic Bananas", "Fruits", "2.99", 80, "Fair-trade bunch of 6"),
                        new SeedProduct("Baby Spinach (250g)", "Vegetables", "2.49", 60, "Washed and ready for salads"),
                        new SeedProduct("Cherry Tomatoes (500g)", "Vegetables", "3.49", 45, "Vine-ripened and sweet"),
                        new SeedProduct("Heirloom Carrots (1kg)", "Vegetables", "1.79", 90, "Purple, yellow and orange"),
                        new SeedProduct("Curly Kale", "Vegetables", "1.99", 0, "Back in stock soon")));

        List<Product> bakery = vendorWithShop("Luca Romano", "bakery@shopline.test", true,
                new ShopRequest("Sunrise Bakery", "Bread and pastries baked fresh every morning from 4am.",
                        "Bakery", "88 Baker Street", "+1 555 0102", ""),
                List.of(
                        new SeedProduct("Sourdough Loaf", "Bakery", "5.50", 25, "48-hour fermented country loaf"),
                        new SeedProduct("Butter Croissant", "Bakery", "2.25", 40, "All-butter, flaky layers"),
                        new SeedProduct("Whole Wheat Bread", "Bakery", "4.00", 30, "100% whole grain"),
                        new SeedProduct("Cinnamon Roll", "Bakery", "3.25", 20, "With cream cheese icing")));

        vendorWithShop("Grace Kim", "dairy@shopline.test", true,
                new ShopRequest("Dairy Direct", "Milk, cheese and eggs from three family farms nearby.",
                        "Dairy", "5 Meadow Road", "+1 555 0103", ""),
                List.of(
                        new SeedProduct("Whole Milk (1L)", "Dairy", "1.89", 100, "Non-homogenised, from grass-fed cows"),
                        new SeedProduct("Greek Yogurt (500g)", "Dairy", "3.49", 50, "Thick and creamy, 10% fat"),
                        new SeedProduct("Aged Cheddar (200g)", "Dairy", "6.99", 35, "Matured for 18 months"),
                        new SeedProduct("Free-range Eggs (12)", "Dairy", "4.29", 70, "Large brown eggs")));

        // A vendor still waiting for approval, so the admin approval flow has something to show.
        vendorWithShop("Sam Okafor", "seafood@shopline.test", false,
                new ShopRequest("Ocean Fresh", "Fish and seafood from the morning market.",
                        "Seafood", "1 Harbour Walk", "+1 555 0104", ""),
                List.of(new SeedProduct("Atlantic Salmon Fillet", "Seafood", "12.99", 15, "Skin-on, 2 portions")));

        User customer = auth.register(new RegisterRequest("Alex Rivera", CUSTOMER_EMAIL, PASSWORD, "customer")).user();
        customer = auth.updateProfile(customer, new ProfileRequest("Alex Rivera", CUSTOMER_EMAIL, "+1 555 0199", "42 Elm Street, Apt 3"));

        // One delivered order spanning two shops, and one pending order.
        List<Order> first = orders.placeOrder(customer, new PlaceOrderRequest(List.of(
                new CartLine(greenValley.get(0).id(), 2),
                new CartLine(greenValley.get(2).id(), 1),
                new CartLine(bakery.get(0).id(), 1)), null));
        User vendor = users.findByEmail(VENDOR_EMAIL).orElseThrow();
        Order gvOrder = first.stream().filter(o -> o.shop().equals("Green Valley Farms")).findFirst().orElseThrow();
        orders.updateStatusByVendor(vendor, gvOrder.id(), "processing");
        orders.updateStatusByVendor(vendor, gvOrder.id(), "shipped");
        orders.updateStatusByVendor(vendor, gvOrder.id(), "delivered");

        orders.placeOrder(customer, new PlaceOrderRequest(List.of(
                new CartLine(greenValley.get(1).id(), 1),
                new CartLine(greenValley.get(3).id(), 2)), null));

        Log.info("Demo data ready. Customer: %s / %s, vendor: %s / %s", CUSTOMER_EMAIL, PASSWORD, VENDOR_EMAIL, PASSWORD);
    }

    private List<Product> vendorWithShop(String name, String email, boolean approved, ShopRequest shop, List<SeedProduct> items) {
        User vendor = auth.register(new RegisterRequest(name, email, PASSWORD, "vendor")).user();
        if (approved) {
            admin.setVendorStatus(vendor.id(), VendorStatus.APPROVED);
        }
        shops.createShop(vendor, shop);
        List<Product> created = new ArrayList<>();
        for (SeedProduct p : items) {
            created.add(shops.createProduct(vendor, new ProductRequest(
                    p.name(), p.description(), p.category(), "", new BigDecimal(p.price()), p.stock(), "active")));
        }
        return created;
    }
}
