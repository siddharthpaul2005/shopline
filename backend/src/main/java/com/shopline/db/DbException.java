package com.shopline.db;

import java.sql.SQLException;

/** Unchecked wrapper for {@link SQLException}, so repository methods don't need {@code throws} clauses. */
public class DbException extends RuntimeException {

    private final String sqlState;

    public DbException(SQLException cause) {
        super(cause.getMessage(), cause);
        this.sqlState = cause.getSQLState();
    }

    /** True when a unique constraint was violated (Postgres error code 23505). */
    public boolean isUniqueViolation() {
        return "23505".equals(sqlState);
    }
}
