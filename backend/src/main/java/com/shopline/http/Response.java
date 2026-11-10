package com.shopline.http;

import java.util.Map;

/** A status code plus a body that will be written as JSON. Handlers that just return an object get a 200. */
public record Response(int status, Object body) {

    public static Response ok(Object body) {
        return new Response(200, body);
    }

    public static Response created(Object body) {
        return new Response(201, body);
    }

    public static Response noContent() {
        return new Response(204, null);
    }

    public static Response error(int status, String message) {
        return new Response(status, Map.of("message", message));
    }
}
