package com.shopline.config;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Server settings, read from environment variables.
 *
 * <p>For local development the values can also be put in a {@code .env} file in the
 * directory the server is started from. Real environment variables always win over the file.
 */
public record Config(
        int port,
        String jdbcUrl,
        String dbUser,
        String dbPassword,
        int dbPoolSize,
        String jwtSecret,
        int jwtTtlHours,
        List<String> corsOrigins,
        String adminName,
        String adminEmail,
        String adminPassword,
        boolean seedDemoData
) {

    public static Config load() {
        Map<String, String> env = new HashMap<>(readDotEnv(Path.of(".env")));
        env.putAll(System.getenv());
        return fromMap(env);
    }

    static Config fromMap(Map<String, String> env) {
        String databaseUrl = require(env, "DATABASE_URL");
        DbUrl db = parseDatabaseUrl(databaseUrl);
        String user = env.getOrDefault("DB_USER", db.user());
        String password = env.getOrDefault("DB_PASSWORD", db.password());

        return new Config(
                intValue(env, "PORT", 8080),
                db.jdbcUrl(),
                user,
                password,
                intValue(env, "DB_POOL_SIZE", 5),
                env.get("JWT_SECRET"),
                intValue(env, "JWT_TTL_HOURS", 24 * 7),
                Arrays.stream(env.getOrDefault("CORS_ORIGINS", "http://localhost:5173").split(","))
                        .map(String::trim)
                        .map(o -> o.endsWith("/") ? o.substring(0, o.length() - 1) : o)
                        .filter(o -> !o.isEmpty())
                        .toList(),
                env.getOrDefault("ADMIN_NAME", "ShopLine Admin"),
                env.get("ADMIN_EMAIL"),
                env.get("ADMIN_PASSWORD"),
                Boolean.parseBoolean(env.getOrDefault("SEED_DEMO_DATA", "false"))
        );
    }

    /** A JDBC URL plus the credentials that were embedded in the original connection string. */
    record DbUrl(String jdbcUrl, String user, String password) {}

    /**
     * Accepts either a JDBC URL ({@code jdbc:postgresql://...}) or the
     * {@code postgresql://user:password@host:port/db} form that Supabase shows in its dashboard.
     */
    static DbUrl parseDatabaseUrl(String url) {
        if (url.startsWith("jdbc:")) {
            return new DbUrl(url, null, null);
        }
        String rest;
        if (url.startsWith("postgresql://")) {
            rest = url.substring("postgresql://".length());
        } else if (url.startsWith("postgres://")) {
            rest = url.substring("postgres://".length());
        } else {
            throw new IllegalArgumentException("DATABASE_URL must start with postgresql://, postgres:// or jdbc:postgresql://");
        }

        String user = null;
        String password = null;
        int at = rest.lastIndexOf('@');
        if (at >= 0) {
            String userInfo = rest.substring(0, at);
            rest = rest.substring(at + 1);
            int colon = userInfo.indexOf(':');
            if (colon >= 0) {
                user = decode(userInfo.substring(0, colon));
                password = decode(userInfo.substring(colon + 1));
            } else {
                user = decode(userInfo);
            }
        }

        String hostAndPath = rest;
        String query = "";
        int q = rest.indexOf('?');
        if (q >= 0) {
            hostAndPath = rest.substring(0, q);
            query = rest.substring(q + 1);
        }

        String host = hostAndPath.split("[:/]", 2)[0];
        boolean local = host.equals("localhost") || host.equals("127.0.0.1");
        StringBuilder params = new StringBuilder(query);
        if (!local && !query.contains("sslmode=")) {
            append(params, "sslmode=require");
        }
        // Supabase's transaction pooler (port 6543) does not support server-side prepared statements.
        if (hostAndPath.contains(":6543") && !query.contains("prepareThreshold=")) {
            append(params, "prepareThreshold=0");
        }

        String jdbc = "jdbc:postgresql://" + hostAndPath + (params.isEmpty() ? "" : "?" + params);
        return new DbUrl(jdbc, user, password);
    }

    private static void append(StringBuilder params, String param) {
        if (!params.isEmpty()) params.append('&');
        params.append(param);
    }

    private static String decode(String s) {
        return URLDecoder.decode(s, StandardCharsets.UTF_8);
    }

    private static String require(Map<String, String> env, String key) {
        String value = env.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(key + " is not set. Copy backend/.env.example to backend/.env and fill it in.");
        }
        return value.trim();
    }

    private static int intValue(Map<String, String> env, String key, int fallback) {
        String value = env.get(key);
        if (value == null || value.isBlank()) return fallback;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException(key + " must be a number, got: " + value);
        }
    }

    /** Minimal .env parser: KEY=VALUE lines, '#' comments, optional surrounding quotes. */
    static Map<String, String> readDotEnv(Path file) {
        Map<String, String> values = new HashMap<>();
        if (!Files.isRegularFile(file)) return values;
        try {
            for (String line : Files.readAllLines(file, StandardCharsets.UTF_8)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                int eq = trimmed.indexOf('=');
                if (eq <= 0) continue;
                String key = trimmed.substring(0, eq).trim();
                String value = trimmed.substring(eq + 1).trim();
                if (value.length() >= 2 && (value.startsWith("\"") && value.endsWith("\"")
                        || value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }
                values.put(key, value);
            }
        } catch (IOException e) {
            throw new IllegalStateException("Could not read " + file.toAbsolutePath(), e);
        }
        return values;
    }
}
