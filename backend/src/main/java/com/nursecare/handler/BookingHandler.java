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
 * /api/bookings          GET (list) / POST (create)
 * /api/bookings/{id}     PUT (update status, e.g. cancel)
 */
public class BookingHandler extends BaseHandler {

    @Override
    protected void route(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        String[] segments = pathSegments(exchange);
        String id = segments.length > 3 ? segments[3] : null;

        switch (method) {
            case "GET" -> sendJson(exchange, 200, listBookings());
            case "POST" -> {
                JSONObject body = readJsonBody(exchange);
                String bookingId = IdUtil.generate("BK");
                insertBooking(bookingId, body);
                JSONObject result = body;
                result.put("id", bookingId);
                result.put("status", "Pending");
                sendJson(exchange, 201, result);
            }
            case "PUT" -> {
                if (id == null) {
                    sendJson(exchange, 400, new JSONObject().put("error", "Booking id required"));
                    return;
                }
                JSONObject body = readJsonBody(exchange);
                updateStatus(id, body.optString("status", "Pending"));
                sendJson(exchange, 200, new JSONObject().put("success", true));
            }
            default -> sendJson(exchange, 405, new JSONObject().put("error", "Method not allowed"));
        }
    }

    private JSONArray listBookings() throws Exception {
        JSONArray arr = new JSONArray();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM bookings ORDER BY created_at DESC");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                JSONObject o = new JSONObject();
                o.put("id", rs.getString("id"));
                o.put("nurseId", rs.getString("nurse_id"));
                o.put("nurseName", rs.getString("nurse_name"));
                o.put("nurseQualification", rs.getString("nurse_qualification"));
                o.put("memberEmail", rs.getString("member_email"));
                o.put("startDate", rs.getString("start_date"));
                o.put("endDate", rs.getString("end_date"));
                o.put("dutyHours", rs.getInt("duty_hours"));
                o.put("notes", rs.getString("notes"));
                o.put("perDaySalary", rs.getDouble("per_day_salary"));
                o.put("status", rs.getString("status"));
                o.put("createdAt", rs.getString("created_at"));
                arr.put(o);
            }
        }
        return arr;
    }

    private void insertBooking(String id, JSONObject body) throws Exception {
        String sql = """
            INSERT INTO bookings (id, nurse_id, nurse_name, nurse_qualification, member_email,
                start_date, end_date, duty_hours, notes, per_day_salary, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = Database.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, body.optString("nurseId", ""));
            ps.setString(3, body.optString("nurseName", ""));
            ps.setString(4, body.optString("nurseQualification", ""));
            ps.setString(5, body.optString("memberEmail", ""));
            ps.setString(6, body.optString("startDate", ""));
            ps.setString(7, body.optString("endDate", ""));
            ps.setInt(8, body.optInt("dutyHours", 8));
            ps.setString(9, body.optString("notes", ""));
            ps.setDouble(10, body.optDouble("perDaySalary", 0));
            ps.setString(11, "Pending");
            ps.setString(12, Instant.now().toString());
            ps.executeUpdate();
        }
    }

    private void updateStatus(String id, String status) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("UPDATE bookings SET status = ? WHERE id = ?")) {
            ps.setString(1, status);
            ps.setString(2, id);
            ps.executeUpdate();
        }
    }
}
