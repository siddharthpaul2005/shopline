package com.shopline.config;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ConfigTest {

    @Test
    void parsesSupabaseSessionPoolerUrl() {
        Config.DbUrl db = Config.parseDatabaseUrl(
                "postgresql://postgres.abcd:p%40ss%3Aword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres");
        assertEquals("jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require", db.jdbcUrl());
        assertEquals("postgres.abcd", db.user());
        assertEquals("p@ss:word", db.password());
    }

    @Test
    void transactionPoolerDisablesPreparedStatements() {
        Config.DbUrl db = Config.parseDatabaseUrl("postgres://u:p@aws-0-eu.pooler.supabase.com:6543/postgres");
        assertEquals("jdbc:postgresql://aws-0-eu.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0", db.jdbcUrl());
    }

    @Test
    void localhostDoesNotForceSsl() {
        Config.DbUrl db = Config.parseDatabaseUrl("postgresql://postgres:secret@localhost:5432/shopline");
        assertEquals("jdbc:postgresql://localhost:5432/shopline", db.jdbcUrl());
    }

    @Test
    void jdbcUrlIsUsedAsIs() {
        Config.DbUrl db = Config.parseDatabaseUrl("jdbc:postgresql://localhost/shopline");
        assertEquals("jdbc:postgresql://localhost/shopline", db.jdbcUrl());
        assertNull(db.user());
    }

    @Test
    void defaultsAndCorsListAreApplied() {
        Config config = Config.fromMap(Map.of(
                "DATABASE_URL", "postgresql://u:p@localhost/db",
                "CORS_ORIGINS", "https://shopline.vercel.app/, http://localhost:5173"));
        assertEquals(8080, config.port());
        assertEquals(List.of("https://shopline.vercel.app", "http://localhost:5173"), config.corsOrigins());
    }

    @Test
    void missingDatabaseUrlFailsWithAHelpfulMessage() {
        assertThrows(IllegalStateException.class, () -> Config.fromMap(Map.of()));
    }
}
