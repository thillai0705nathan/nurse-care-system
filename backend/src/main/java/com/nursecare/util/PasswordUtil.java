package com.nursecare.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Salted SHA-256 password hashing. Stored format is "salt:hash",
 * both Base64-encoded, so no plain-text passwords ever hit the database.
 */
public final class PasswordUtil {

    private PasswordUtil() {
    }

    public static String hash(String password) {
        byte[] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        String saltStr = Base64.getEncoder().encodeToString(salt);
        String hash = sha256(saltStr + password);
        return saltStr + ":" + hash;
    }

    public static boolean verify(String password, String stored) {
        if (stored == null || !stored.contains(":")) return false;
        String[] parts = stored.split(":", 2);
        String saltStr = parts[0];
        String expectedHash = parts[1];
        return sha256(saltStr + password).equals(expectedHash);
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}
