package com.shopline.db;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;

/** Helpers for reading values out of a JDBC {@link ResultSet}. */
public final class Rows {
    private Rows() {}

    /** Reads a timestamptz column as an ISO-8601 string (e.g. "2026-11-10T09:30:00Z"), which JavaScript can parse. */
    public static String timestamp(ResultSet row, String column) throws SQLException {
        OffsetDateTime value = row.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant().toString();
    }

    /** Reads a nullable bigint column. */
    public static Long nullableLong(ResultSet row, String column) throws SQLException {
        long value = row.getLong(column);
        return row.wasNull() ? null : value;
    }
}
