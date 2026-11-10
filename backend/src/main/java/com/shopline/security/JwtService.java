package com.shopline.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.OptionalLong;

/**
 * Issues and verifies JSON Web Tokens signed with HMAC-SHA256 (the "HS256" algorithm).
 *
 * <p>A token is {@code base64url(header).base64url(payload).base64url(signature)}. The payload
 * holds the user id ("sub") and an expiry time ("exp"). Only the server knows the secret, so
 * only the server can produce a valid signature.
 */
public final class JwtService {

    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();
    private static final String HEADER = ENCODER.encodeToString(
            "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));

    private final byte[] secret;
    private final Duration ttl;
    private final ObjectMapper json;
    private final Clock clock;

    public JwtService(String secret, Duration ttl, ObjectMapper json, Clock clock) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttl = ttl;
        this.json = json;
        this.clock = clock;
    }

    public String issue(long userId, String role) {
        long now = clock.instant().getEpochSecond();
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", String.valueOf(userId));
        payload.put("role", role);
        payload.put("iat", now);
        payload.put("exp", now + ttl.toSeconds());
        try {
            String body = ENCODER.encodeToString(json.writeValueAsBytes(payload));
            String unsigned = HEADER + "." + body;
            return unsigned + "." + ENCODER.encodeToString(sign(unsigned));
        } catch (Exception e) {
            throw new IllegalStateException("Could not create token", e);
        }
    }

    /** Returns the user id if the token is genuine and not expired, otherwise empty. */
    public OptionalLong verify(String token) {
        if (token == null) return OptionalLong.empty();
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !parts[0].equals(HEADER)) return OptionalLong.empty();
        try {
            byte[] expected = sign(parts[0] + "." + parts[1]);
            byte[] actual = DECODER.decode(parts[2]);
            // Constant-time comparison, so response timing doesn't leak how much of the signature matched.
            if (!MessageDigest.isEqual(expected, actual)) return OptionalLong.empty();

            JsonNode payload = json.readTree(DECODER.decode(parts[1]));
            long exp = payload.path("exp").asLong(0);
            if (exp <= clock.instant().getEpochSecond()) return OptionalLong.empty();
            return OptionalLong.of(Long.parseLong(payload.path("sub").asText()));
        } catch (Exception e) {
            return OptionalLong.empty();
        }
    }

    private byte[] sign(String data) throws GeneralSecurityException {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }
}
