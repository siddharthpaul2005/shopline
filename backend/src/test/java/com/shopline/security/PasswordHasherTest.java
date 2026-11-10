package com.shopline.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordHasherTest {

    private final PasswordHasher hasher = new PasswordHasher();

    @Test
    void correctPasswordMatches() {
        String hash = hasher.hash("hunter22");
        assertTrue(hasher.matches("hunter22", hash));
    }

    @Test
    void wrongPasswordDoesNotMatch() {
        assertFalse(hasher.matches("hunter23", hasher.hash("hunter22")));
    }

    @Test
    void samePasswordGetsDifferentHashes() {
        // Random salt: equal passwords must not produce equal hashes.
        assertNotEquals(hasher.hash("hunter22"), hasher.hash("hunter22"));
    }

    @Test
    void hashDoesNotContainThePassword() {
        assertFalse(hasher.hash("hunter22").contains("hunter22"));
    }

    @Test
    void malformedStoredHashNeverMatches() {
        assertFalse(hasher.matches("x", null));
        assertFalse(hasher.matches("x", "plaintext"));
        assertFalse(hasher.matches("x", "pbkdf2_sha512$abc$def$ghi"));
    }
}
