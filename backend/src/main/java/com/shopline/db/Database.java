package com.shopline.db;

import com.shopline.config.Config;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Thin wrapper around JDBC.
 *
 * <p>Repositories call {@link #query}, {@link #update} etc. and don't deal with connections.
 * Code wrapped in {@link #transaction} runs on a single connection that is committed at the
 * end, or rolled back if anything throws. The connection is bound to the current thread, so
 * every repository call made inside the transaction automatically takes part in it.
 */
public final class Database implements AutoCloseable {

    @FunctionalInterface
    public interface RowMapper<T> {
        T map(ResultSet row) throws SQLException;
    }

    @FunctionalInterface
    private interface ConnectionWork<T> {
        T apply(Connection connection) throws SQLException;
    }

    private final HikariDataSource dataSource;
    private final ThreadLocal<Connection> currentTransaction = new ThreadLocal<>();

    public Database(Config config) {
        HikariConfig hikari = new HikariConfig();
        hikari.setJdbcUrl(config.jdbcUrl());
        if (config.dbUser() != null) hikari.setUsername(config.dbUser());
        if (config.dbPassword() != null) hikari.setPassword(config.dbPassword());
        hikari.setMaximumPoolSize(config.dbPoolSize());
        hikari.setPoolName("shopline-db");
        this.dataSource = new HikariDataSource(hikari);
    }

    /** Runs {@code work} inside a transaction and returns its result. Nested calls join the outer transaction. */
    public <T> T transaction(Supplier<T> work) {
        if (currentTransaction.get() != null) {
            return work.get();
        }
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            currentTransaction.set(connection);
            try {
                T result = work.get();
                connection.commit();
                return result;
            } catch (RuntimeException | Error e) {
                connection.rollback();
                throw e;
            } finally {
                currentTransaction.remove();
                connection.setAutoCommit(true);
            }
        } catch (SQLException e) {
            throw new DbException(e);
        }
    }

    public <T> List<T> query(String sql, RowMapper<T> mapper, Object... params) {
        return withConnection(connection -> {
            try (PreparedStatement statement = prepare(connection, sql, params);
                 ResultSet rows = statement.executeQuery()) {
                List<T> results = new ArrayList<>();
                while (rows.next()) {
                    results.add(mapper.map(rows));
                }
                return results;
            }
        });
    }

    public <T> Optional<T> queryOne(String sql, RowMapper<T> mapper, Object... params) {
        List<T> results = query(sql, mapper, params);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /** For {@code select count(*) ...} style queries returning a single number. */
    public long count(String sql, Object... params) {
        return queryOne(sql, row -> row.getLong(1), params).orElse(0L);
    }

    /** Runs an insert/update/delete and returns the number of affected rows. */
    public int update(String sql, Object... params) {
        return withConnection(connection -> {
            try (PreparedStatement statement = prepare(connection, sql, params)) {
                return statement.executeUpdate();
            }
        });
    }

    /** Runs an {@code insert ... returning id} statement and returns the new id. */
    public long insert(String sql, Object... params) {
        return queryOne(sql, row -> row.getLong(1), params)
                .orElseThrow(() -> new IllegalStateException("Insert did not return an id: " + sql));
    }

    /** Executes a whole SQL file from the classpath (used for the schema). */
    public void runScript(String resourcePath) {
        String sql;
        try (InputStream in = Database.class.getResourceAsStream(resourcePath)) {
            if (in == null) throw new IllegalStateException("Missing resource " + resourcePath);
            sql = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Could not read " + resourcePath, e);
        }
        withConnection(connection -> {
            try (Statement statement = connection.createStatement()) {
                statement.execute(sql);
                return null;
            }
        });
    }

    public boolean isHealthy() {
        try {
            return count("select 1") == 1;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private <T> T withConnection(ConnectionWork<T> work) {
        try {
            Connection tx = currentTransaction.get();
            if (tx != null) {
                return work.apply(tx);
            }
            try (Connection connection = dataSource.getConnection()) {
                return work.apply(connection);
            }
        } catch (SQLException e) {
            throw new DbException(e);
        }
    }

    private static PreparedStatement prepare(Connection connection, String sql, Object... params) throws SQLException {
        PreparedStatement statement = connection.prepareStatement(sql);
        for (int i = 0; i < params.length; i++) {
            Object param = params[i];
            if (param instanceof Enum<?> e) {
                // All enums are stored as their lowercase name, e.g. Role.VENDOR -> 'vendor'.
                statement.setString(i + 1, e.name().toLowerCase());
            } else if (param instanceof Long[] ids) {
                statement.setArray(i + 1, connection.createArrayOf("bigint", ids));
            } else {
                statement.setObject(i + 1, param);
            }
        }
        return statement;
    }

    @Override
    public void close() {
        dataSource.close();
    }
}
