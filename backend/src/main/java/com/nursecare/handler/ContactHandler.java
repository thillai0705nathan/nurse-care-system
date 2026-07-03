package com.nursecare.handler;

import com.nursecare.db.Database;
import com.nursecare.util.IdUtil;
import com.sun.net.httpserver.HttpExchange;
import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Instant;

/**
 * /api/contact   GET (list, e.g. for an admin inbox) / POST (submit a message)
 */
public class ContactHandler extends BaseHandler {

    @Override
    protected void route(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();

        switch (method) {
            case "GET" -> sendJson(exchange, 200, listMessages());
            case "POST" -> {
                JSONObject body = readJsonBody(exchange);
                String id = IdUtil.generate("MSG");
                insertMessage(id, body);
                JSONObject result = new JSONObject();
                result.put("id", id);
                result.put("success", true);
                sendJson(exchange, 201, result);
            }
            default -> sendJson(exchange, 405, new JSONObject().put("error", "Method not allowed"));
        }
    }

    private JSONArray listMessages() throws Exception {
        JSONArray arr = new JSONArray();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM contact_messages ORDER BY created_at DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                JSONObject o = new JSONObject();
                o.put("id", rs.getString("id"));
                o.put("name", rs.getString("name"));
                o.put("email", rs.getString("email"));
                o.put("subject", rs.getString("subject"));
                o.put("message", rs.getString("message"));
                o.put("createdAt", rs.getString("created_at"));
                arr.put(o);
            }
        }
        return arr;
    }

    private void insertMessage(String id, JSONObject body) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)")) {
            ps.setString(1, id);
            ps.setString(2, body.optString("name", ""));
            ps.setString(3, body.optString("email", ""));
            ps.setString(4, body.optString("subject", ""));
            ps.setString(5, body.optString("message", ""));
            ps.setString(6, Instant.now().toString());
            ps.executeUpdate();
        }
    }
}
