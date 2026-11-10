package com.shopline.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/** Tiny console logger. Hosting platforms (Render, Railway, ...) collect stdout/stderr. */
public final class Log {
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private Log() {}

    public static void info(String message, Object... args) {
        System.out.println(LocalDateTime.now().format(TIME) + " INFO  " + String.format(message, args));
    }

    public static void warn(String message, Object... args) {
        System.out.println(LocalDateTime.now().format(TIME) + " WARN  " + String.format(message, args));
    }

    public static void error(String message, Throwable error) {
        System.err.println(LocalDateTime.now().format(TIME) + " ERROR " + message);
        if (error != null) error.printStackTrace();
    }
}
