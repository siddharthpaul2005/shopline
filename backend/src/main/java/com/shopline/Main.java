package com.shopline;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.shopline.config.Config;
import com.shopline.controller.AdminController;
import com.shopline.controller.AuthController;
import com.shopline.controller.CustomerController;
import com.shopline.controller.VendorController;
import com.shopline.db.Database;
import com.shopline.db.DemoData;
import com.shopline.http.Response;
import com.shopline.http.Router;
import com.shopline.repository.OrderRepository;
import com.shopline.repository.ProductRepository;
import com.shopline.repository.ShopRepository;
import com.shopline.repository.StatsRepository;
import com.shopline.repository.UserRepository;
import com.shopline.security.JwtService;
import com.shopline.security.PasswordHasher;
import com.shopline.service.AdminService;
import com.shopline.service.AuthService;
import com.shopline.service.OrderService;
import com.shopline.service.ShopService;
import com.shopline.util.Log;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Entry point. Builds every object by hand (no dependency-injection framework):
 * config → database → repositories → services → controllers → HTTP server.
 */
public final class Main {

    public static void main(String[] args) throws IOException {
        Config config = Config.load();

        ObjectMapper json = JsonMapper.builder()
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
                .build();

        Database db = new Database(config);
        db.runScript("/db/schema.sql");
        Log.info("Database schema is up to date");

        // Repositories (SQL)
        UserRepository userRepo = new UserRepository(db);
        ShopRepository shopRepo = new ShopRepository(db);
        ProductRepository productRepo = new ProductRepository(db);
        OrderRepository orderRepo = new OrderRepository(db);
        StatsRepository statsRepo = new StatsRepository(db);

        // Services (business rules)
        JwtService jwt = new JwtService(jwtSecret(config), Duration.ofHours(config.jwtTtlHours()), json, Clock.systemUTC());
        AuthService auth = new AuthService(userRepo, new PasswordHasher(), jwt);
        ShopService shops = new ShopService(shopRepo, productRepo);
        OrderService orders = new OrderService(db, orderRepo, productRepo, shopRepo);
        AdminService admin = new AdminService(userRepo, shopRepo, statsRepo);

        auth.ensureAdmin(config.adminName(), config.adminEmail(), config.adminPassword());
        if (config.seedDemoData()) {
            new DemoData(userRepo, auth, admin, shops, orders).seedIfEmpty();
        }

        // Routes
        Router router = new Router(json, auth::authenticate, config.corsOrigins());
        router.get("/", req -> Map.of("name", "ShopLine API", "status", "ok"));
        router.get("/api/health", req -> db.isHealthy()
                ? Map.of("status", "ok")
                : new Response(503, Map.of("status", "database unavailable")));
        new AuthController(auth).register(router);
        new CustomerController(shops, orders, auth).register(router);
        new VendorController(shops, orders, admin).register(router);
        new AdminController(admin, orders).register(router);

        // HTTP server from the JDK; each request runs on its own virtual thread.
        HttpServer server = HttpServer.create(new InetSocketAddress(config.port()), 0);
        server.createContext("/", router);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.start();

        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            Log.info("Shutting down...");
            server.stop(2);
            db.close();
        }));

        Log.info("ShopLine API listening on port %d (CORS origins: %s)", config.port(), config.corsOrigins());
    }

    private static String jwtSecret(Config config) {
        if (config.jwtSecret() != null && !config.jwtSecret().isBlank()) {
            return config.jwtSecret();
        }
        byte[] random = new byte[48];
        new SecureRandom().nextBytes(random);
        Log.warn("JWT_SECRET is not set; using a random one. Everyone is signed out whenever the server restarts.");
        return Base64.getEncoder().encodeToString(random);
    }
}
