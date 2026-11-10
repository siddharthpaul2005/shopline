package com.shopline.http;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopline.model.User;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.util.Map;

/** One incoming HTTP request, as seen by a route handler. */
public final class Request {

    private static final int MAX_BODY_BYTES = 1_000_000;

    private final HttpExchange exchange;
    private final Map<String, String> pathParams;
    private final User user;
    private final ObjectMapper json;

    Request(HttpExchange exchange, Map<String, String> pathParams, User user, ObjectMapper json) {
        this.exchange = exchange;
        this.pathParams = pathParams;
        this.user = user;
        this.json = json;
    }

    /** The logged-in user. Only available on routes that require a role. */
    public User user() {
        if (user == null) throw new IllegalStateException("Route is public; no user is available");
        return user;
    }

    /** Reads a numeric path parameter, e.g. {@code :id} in {@code /api/shops/:id}. */
    public long id(String name) {
        String raw = pathParams.get(name);
        try {
            return Long.parseLong(raw);
        } catch (NumberFormatException e) {
            throw ApiException.notFound("Not found");
        }
    }

    /** Parses the JSON body into the given type. */
    public <T> T body(Class<T> type) throws IOException {
        byte[] bytes = exchange.getRequestBody().readNBytes(MAX_BODY_BYTES + 1);
        if (bytes.length > MAX_BODY_BYTES) {
            throw new ApiException(413, "Request body is too large");
        }
        if (bytes.length == 0) {
            throw ApiException.badRequest("Request body is required");
        }
        T value = json.readValue(bytes, type);
        if (value == null) {
            throw ApiException.badRequest("Request body is required");
        }
        return value;
    }
}
