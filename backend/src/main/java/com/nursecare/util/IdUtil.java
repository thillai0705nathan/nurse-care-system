package com.nursecare.util;

public final class IdUtil {

    private IdUtil() {
    }

    public static String generate(String prefix) {
        return prefix + "-" + (System.currentTimeMillis() % 10000000L);
    }
}
