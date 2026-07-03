package com.nursecare.handler;

import com.nursecare.db.Database;
import com.nursecare.util.IdUtil;
import com.nursecare.util.PasswordUtil;
import com.sun.net.httpserver.HttpExchange;
import org.json.JSONObject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Instant;

/**
 * /api/auth/admin/signup   POST
 * /api/auth/admin/login    POST
 */
public class AdminAuthHandler extends BaseHandler {

    private static final String INVITE_CODE = "ADMIN2026";

    @Override
    protected void route(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        if (!"POST".equalsIgnoreCase(method)) {
            sendJson(exchange, 405, new JSONObject().put("error", "Method not allowed"));
            return;
        }

        if (path.endsWith("/signup")) {
            handleSignup(exchange);
        } else if (path.endsWith("/login")) {
            handleLogin(exchange);
        } else {
            sendJson(exchange, 404, new JSONObject().put("error", "Not found"));
        }
    }

    private void handleSignup(HttpExchange exchange) throws Exception {
        JSONObject body = readJsonBody(exchange);
        String fullName = body.optString("fullName", "").trim();
        String email = body.optString("email", "").trim().toLowerCase();
        String password = body.optString("password", "");
        String inviteCode = body.optString("inviteCode", "").trim();

        if (fullName.isEmpty() || email.isEmpty() || password.length() < 6) {
            sendJson(exchange, 400, new JSONObject().put("error",
                    "Full name, email and a password of at least 6 characters are required."));
            return;
        }
        if (!INVITE_CODE.equalsIgnoreCase(inviteCode)) {
            sendJson(exchange, 400, new JSONObject().put("error", "Invalid invite code."));
            return;
        }

        try (Connection conn = Database.getConnection()) {
            try (PreparedStatement check = conn.prepareStatement("SELECT id FROM admin_accounts WHERE email = ?")) {
                check.setString(1, email);
                try (ResultSet rs = check.executeQuery()) {
                    if (rs.next()) {
                        sendJson(exchange, 409, new JSONObject().put("error", "An account with this email already exists."));
                        return;
                    }
                }
            }

            String id = IdUtil.generate("ADM");
            String hash = PasswordUtil.hash(password);
            try (PreparedStatement insert = conn.prepareStatement(
                    "INSERT INTO admin_accounts (id, full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")) {
                insert.setString(1, id);
                insert.setString(2, fullName);
                insert.setString(3, email);
                insert.setString(4, hash);
                insert.setString(5, Instant.now().toString());
                insert.executeUpdate();
            }

            JSONObject result = new JSONObject();
            result.put("id", id);
            result.put("fullName", fullName);
            result.put("email", email);
            sendJson(exchange, 201, result);
        }
    }

    private void handleLogin(HttpExchange exchange) throws Exception {
        JSONObject body = readJsonBody(exchange);
        String email = body.optString("email", "").trim().toLowerCase();
        String password = body.optString("password", "");

        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM admin_accounts WHERE email = ?")) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && PasswordUtil.verify(password, rs.getString("password_hash"))) {
                    JSONObject result = new JSONObject();
                    result.put("id", rs.getString("id"));
                    result.put("fullName", rs.getString("full_name"));
                    result.put("email", rs.getString("email"));
                    sendJson(exchange, 200, result);
                } else {
                    sendJson(exchange, 401, new JSONObject().put("error", "Invalid email or password."));
                }
            }
        }
    }
}
