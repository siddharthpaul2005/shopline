package com.shopline.http;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopline.db.DbException;
import com.shopline.model.Role;
import com.shopline.model.User;
import com.shopline.util.Log;
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Maps HTTP method + path to a handler, and takes care of everything around it:
 * CORS, authentication, role checks, JSON encoding and turning exceptions into error responses.
 *
 * <pre>
 *   router.get("/api/shops/:id", req -> shops.find(req.id("id")));          // public
 *   router.post("/api/orders", req -> ..., Role.CUSTOMER);                   // customers only
 * </pre>
 */
public final class Router implements HttpHandler {

    @FunctionalInterface
    public interface Handler {
        /** Returns the response body (sent as 200 JSON) or a {@link Response} for other status codes. */
        Object handle(Request request) throws Exception;
    }

    /** {@code roles == null} means the route is public. */
    private record Route(String method, String[] segments, Set<Role> roles, Handler handler) {

        /** Returns the path parameters if the path matches, otherwise null. */
        Map<String, String> match(String[] path) {
            if (path.length != segments.length) return null;
            Map<String, String> params = new HashMap<>();
            for (int i = 0; i < segments.length; i++) {
                if (segments[i].startsWith(":")) {
                    params.put(segments[i].substring(1), path[i]);
                } else if (!segments[i].equals(path[i])) {
                    return null;
                }
            }
            return params;
        }
    }

    private final List<Route> routes = new ArrayList<>();
    private final ObjectMapper json;
    private final Function<String, User> authenticator;
    private final List<String> allowedOrigins;

    /**
     * @param authenticator turns a bearer token into a user, or throws {@link ApiException} (401)
     * @param allowedOrigins frontend URLs allowed to call the API from a browser ("*" allows any)
     */
    public Router(ObjectMapper json, Function<String, User> authenticator, List<String> allowedOrigins) {
        this.json = json;
        this.authenticator = authenticator;
        this.allowedOrigins = allowedOrigins;
    }

    public void get(String path, Handler handler, Role... roles) {
        add("GET", path, handler, roles);
    }

    public void post(String path, Handler handler, Role... roles) {
        add("POST", path, handler, roles);
    }

    public void put(String path, Handler handler, Role... roles) {
        add("PUT", path, handler, roles);
    }

    public void delete(String path, Handler handler, Role... roles) {
        add("DELETE", path, handler, roles);
    }

    private void add(String method, String path, Handler handler, Role[] roles) {
        Set<Role> allowed = roles.length == 0 ? null : EnumSet.copyOf(Arrays.asList(roles));
        routes.add(new Route(method, split(path), allowed, handler));
    }

    @Override
    public void handle(HttpExchange exchange) {
        long started = System.nanoTime();
        int status = 500;
        try (exchange) {
            addCorsHeaders(exchange);
            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                status = 204;
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            Response response = dispatch(exchange);
            status = response.status();
            write(exchange, response);
        } catch (IOException e) {
            Log.error("Failed to write response", e);
        } finally {
            long ms = (System.nanoTime() - started) / 1_000_000;
            Log.info("%s %s -> %d (%d ms)", exchange.getRequestMethod(), exchange.getRequestURI().getPath(), status, ms);
        }
    }

    private Response dispatch(HttpExchange exchange) {
        try {
            return route(exchange);
        } catch (ApiException e) {
            return Response.error(e.status(), e.getMessage());
        } catch (JsonProcessingException e) {
            return Response.error(400, "Request body is not valid JSON");
        } catch (DbException e) {
            if (e.isUniqueViolation()) {
                return Response.error(409, "That record already exists");
            }
            Log.error("Database error", e);
            return Response.error(500, "Something went wrong. Please try again.");
        } catch (Exception e) {
            Log.error("Unhandled error", e);
            return Response.error(500, "Something went wrong. Please try again.");
        }
    }

    private Response route(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        String[] path = split(exchange.getRequestURI().getPath());
        boolean pathExists = false;

        for (Route route : routes) {
            Map<String, String> params = route.match(path);
            if (params == null) continue;
            pathExists = true;
            if (!route.method().equals(method)) continue;

            User user = null;
            if (route.roles() != null) {
                user = authenticate(exchange);
                if (!route.roles().contains(user.role())) {
                    throw ApiException.forbidden("You don't have access to this page");
                }
            }
            Object result = route.handler().handle(new Request(exchange, params, user, json));
            return result instanceof Response response ? response : Response.ok(result);
        }
        if (pathExists) throw new ApiException(405, "Method not allowed");
        throw ApiException.notFound("Not found");
    }

    private User authenticate(HttpExchange exchange) {
        String header = exchange.getRequestHeaders().getFirst("Authorization");
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw ApiException.unauthorized("Please sign in to continue");
        }
        return authenticator.apply(header.substring(7).trim());
    }

    private void addCorsHeaders(HttpExchange exchange) {
        String origin = exchange.getRequestHeaders().getFirst("Origin");
        if (origin == null) return;
        if (allowedOrigins.contains("*") || allowedOrigins.contains(origin)) {
            Headers headers = exchange.getResponseHeaders();
            headers.set("Access-Control-Allow-Origin", origin);
            headers.set("Vary", "Origin");
            headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
            headers.set("Access-Control-Max-Age", "600");
        }
    }

    private void write(HttpExchange exchange, Response response) throws IOException {
        if (response.status() == 204) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }
        byte[] bytes = json.writeValueAsBytes(response.body());
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(response.status(), bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private static String[] split(String path) {
        return Arrays.stream(path.split("/")).filter(s -> !s.isEmpty()).toArray(String[]::new);
    }
}
