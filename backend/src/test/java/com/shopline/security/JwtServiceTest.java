package com.shopline.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET = "test-secret-that-is-at-least-32-characters-long";
    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    private JwtService at(Instant instant) {
        return new JwtService(SECRET, Duration.ofHours(1), new ObjectMapper(), Clock.fixed(instant, ZoneOffset.UTC));
    }

    @Test
    void issuedTokenVerifiesToTheSameUser() {
        String token = at(NOW).issue(42, "customer");
        assertEquals(42, at(NOW).verify(token).getAsLong());
    }

    @Test
    void expiredTokenIsRejected() {
        String token = at(NOW).issue(42, "customer");
        assertTrue(at(NOW.plus(Duration.ofHours(2))).verify(token).isEmpty());
    }

    @Test
    void tamperedPayloadIsRejected() {
        JwtService jwt = at(NOW);
        String[] parts = jwt.issue(42, "customer").split("\\.");
        String otherPayload = jwt.issue(1, "admin").split("\\.")[1];
        assertTrue(jwt.verify(parts[0] + "." + otherPayload + "." + parts[2]).isEmpty());
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtService other = new JwtService("a-completely-different-secret-of-32+-chars", Duration.ofHours(1),
                new ObjectMapper(), Clock.fixed(NOW, ZoneOffset.UTC));
        assertTrue(at(NOW).verify(other.issue(42, "admin")).isEmpty());
    }

    @Test
    void garbageIsRejected() {
        JwtService jwt = at(NOW);
        assertTrue(jwt.verify(null).isEmpty());
        assertTrue(jwt.verify("").isEmpty());
        assertTrue(jwt.verify("a.b.c").isEmpty());
    }

    @Test
    void shortSecretIsRefused() {
        assertThrows(IllegalArgumentException.class,
                () -> new JwtService("too-short", Duration.ofHours(1), new ObjectMapper(), Clock.systemUTC()));
    }
}
