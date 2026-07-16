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
 * /api/auth/member/signup   POST
 * /api/auth/member/login    POST
 */
public class MemberAuthHandler extends BaseHandler {

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
        String phone = body.optString("phone", "").trim();
        String password = body.optString("password", "");

        if (fullName.isEmpty() || email.isEmpty() || phone.isEmpty() || password.length() < 6) {
            sendJson(exchange, 400, new JSONObject().put("error",
                    "All fields are required and password must be at least 6 characters."));
            return;
        }

        try (Connection conn = Database.getConnection()) {
            try (PreparedStatement check = conn.prepareStatement("SELECT id FROM member_accounts WHERE email = ?")) {
                check.setString(1, email);
                try (ResultSet rs = check.executeQuery()) {
                    if (rs.next()) {
                        sendJson(exchange, 409, new JSONObject().put("error", "An account with this email already exists."));
                        return;
                    }
                }
            }
            try (PreparedStatement check = conn.prepareStatement("SELECT id FROM member_accounts WHERE phone = ?")) {
                check.setString(1, phone);
                try (ResultSet rs = check.executeQuery()) {
                    if (rs.next()) {
                        sendJson(exchange, 409, new JSONObject().put("error", "An account with this phone number already exists."));
                        return;
                    }
                }
            }

            String id = IdUtil.generate("MEM");
            String hash = PasswordUtil.hash(password);
            try (PreparedStatement insert = conn.prepareStatement(
                    "INSERT INTO member_accounts (id, full_name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")) {
                insert.setString(1, id);
                insert.setString(2, fullName);
                insert.setString(3, email);
                insert.setString(4, phone);
                insert.setString(5, hash);
                insert.setString(6, Instant.now().toString());
                insert.executeUpdate();
            }

            JSONObject result = new JSONObject();
            result.put("id", id);
            result.put("fullName", fullName);
            result.put("email", email);
            sendJson(exchange, 201, result);
        }
    }

    /**
     * Accepts either an email address or a phone number in the "email"
     * field - a single OR query matches whichever one it turns out to be.
     */
    private void handleLogin(HttpExchange exchange) throws Exception {
        JSONObject body = readJsonBody(exchange);
        String identifier = body.optString("email", "").trim().toLowerCase();
        String password = body.optString("password", "");

        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM member_accounts WHERE email = ? OR phone = ?")) {
            ps.setString(1, identifier);
            ps.setString(2, identifier);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next() && PasswordUtil.verify(password, rs.getString("password_hash"))) {
                    JSONObject result = new JSONObject();
                    result.put("id", rs.getString("id"));
                    result.put("fullName", rs.getString("full_name"));
                    result.put("email", rs.getString("email"));
                    sendJson(exchange, 200, result);
                } else {
                    sendJson(exchange, 401, new JSONObject().put("error", "Invalid email/phone or password."));
                }
            }
        }
    }
}
