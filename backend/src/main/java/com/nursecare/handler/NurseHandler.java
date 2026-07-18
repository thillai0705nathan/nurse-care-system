package com.nursecare.handler;

import com.nursecare.db.Database;
import com.nursecare.model.Nurse;
import com.nursecare.util.IdUtil;
import com.sun.net.httpserver.HttpExchange;
import org.json.JSONArray;
import org.json.JSONObject;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * /api/nurses            GET (list) / POST (create)
 * /api/nurses/{id}       GET (one) / PUT (update) / DELETE
 */
public class NurseHandler extends BaseHandler {

    @Override
    protected void route(HttpExchange exchange) throws Exception {
        String method = exchange.getRequestMethod();
        String[] segments = pathSegments(exchange);
        String id = segments.length > 3 ? segments[3] : null;

        switch (method) {
            case "GET" -> {
                if (id == null) {
                    sendJson(exchange, 200, listNurses());
                } else {
                    Nurse nurse = findNurse(id);
                    if (nurse == null) {
                        sendJson(exchange, 404, new JSONObject().put("error", "Nurse not found"));
                    } else {
                        sendJson(exchange, 200, nurse.toJson());
                    }
                }
            }
            case "POST" -> {
                Nurse nurse = Nurse.fromJson(readJsonBody(exchange));
                nurse.id = IdUtil.generate("NUR");
                insertNurse(nurse);
                sendJson(exchange, 201, nurse.toJson());
            }
            case "PUT" -> {
                if (id == null) {
                    sendJson(exchange, 400, new JSONObject().put("error", "Nurse id required"));
                    return;
                }
                Nurse nurse = Nurse.fromJson(readJsonBody(exchange));
                nurse.id = id;
                updateNurse(nurse);
                sendJson(exchange, 200, nurse.toJson());
            }
            case "DELETE" -> {
                if (id == null) {
                    sendJson(exchange, 400, new JSONObject().put("error", "Nurse id required"));
                    return;
                }
                deleteNurse(id);
                sendJson(exchange, 200, new JSONObject().put("success", true));
            }
            default -> sendJson(exchange, 405, new JSONObject().put("error", "Method not allowed"));
        }
    }

    private JSONArray listNurses() throws Exception {
        JSONArray arr = new JSONArray();
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM nurses ORDER BY full_name");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                arr.put(mapRow(rs).toJson());
            }
        }
        return arr;
    }

    private Nurse findNurse(String id) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("SELECT * FROM nurses WHERE id = ?")) {
            ps.setString(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapRow(rs);
            }
        }
        return null;
    }

    private void insertNurse(Nurse n) throws Exception {
        String sql = """
            INSERT INTO nurses (id, full_name, gender, age, nationality, blood_group, contact_number,
                email, emergency_contact, address, qualification, experience, skills, languages,
                certifications, employee_type, shift_preference, joining_date, monthly_salary,
                per_day_salary, availability, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = Database.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            bindNurse(ps, n, true);
            ps.executeUpdate();
        }
    }

    private void updateNurse(Nurse n) throws Exception {
        String sql = """
            UPDATE nurses SET full_name=?, gender=?, age=?, nationality=?, blood_group=?, contact_number=?,
                email=?, emergency_contact=?, address=?, qualification=?, experience=?, skills=?, languages=?,
                certifications=?, employee_type=?, shift_preference=?, joining_date=?, monthly_salary=?,
                per_day_salary=?, availability=?, photo=? WHERE id=?
        """;
        try (Connection conn = Database.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            bindNurse(ps, n, false);
            ps.executeUpdate();
        }
        syncNurseNameOnBookings(n);
    }

    /**
     * Bookings store their own snapshot of nurse_name/nurse_qualification
     * (taken at booking time) rather than joining live against the nurses
     * table. Whenever a nurse's name or qualification is edited, keep every
     * existing booking's snapshot in sync so booking history and
     * notifications never show a stale name.
     */
    private void syncNurseNameOnBookings(Nurse n) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(
                     "UPDATE bookings SET nurse_name = ?, nurse_qualification = ? WHERE nurse_id = ?")) {
            ps.setString(1, n.fullName);
            ps.setString(2, n.qualification);
            ps.setString(3, n.id);
            ps.executeUpdate();
        }
    }

    private void bindNurse(PreparedStatement ps, Nurse n, boolean withId) throws Exception {
        int i = 1;
        if (withId) ps.setString(i++, n.id);
        ps.setString(i++, n.fullName);
        ps.setString(i++, n.gender);
        ps.setInt(i++, n.age);
        ps.setString(i++, n.nationality);
        ps.setString(i++, n.bloodGroup);
        ps.setString(i++, n.contactNumber);
        ps.setString(i++, n.email);
        ps.setString(i++, n.emergencyContact);
        ps.setString(i++, n.address);
        ps.setString(i++, n.qualification);
        ps.setInt(i++, n.experience);
        ps.setString(i++, n.skills);
        ps.setString(i++, n.languages);
        ps.setString(i++, n.certifications);
        ps.setString(i++, n.employeeType);
        ps.setString(i++, n.shiftPreference);
        ps.setString(i++, n.joiningDate);
        ps.setDouble(i++, n.monthlySalary);
        ps.setDouble(i++, n.perDaySalary);
        ps.setString(i++, n.availability);
        ps.setString(i++, n.photo);
        if (!withId) ps.setString(i, n.id);
    }

    private void deleteNurse(String id) throws Exception {
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement("DELETE FROM nurses WHERE id = ?")) {
            ps.setString(1, id);
            ps.executeUpdate();
        }
    }

    private Nurse mapRow(ResultSet rs) throws Exception {
        Nurse n = new Nurse();
        n.id = rs.getString("id");
        n.fullName = rs.getString("full_name");
        n.gender = rs.getString("gender");
        n.age = rs.getInt("age");
        n.nationality = rs.getString("nationality");
        n.bloodGroup = rs.getString("blood_group");
        n.contactNumber = rs.getString("contact_number");
        n.email = rs.getString("email");
        n.emergencyContact = rs.getString("emergency_contact");
        n.address = rs.getString("address");
        n.qualification = rs.getString("qualification");
        n.experience = rs.getInt("experience");
        n.skills = rs.getString("skills");
        n.languages = rs.getString("languages");
        n.certifications = rs.getString("certifications");
        n.employeeType = rs.getString("employee_type");
        n.shiftPreference = rs.getString("shift_preference");
        n.joiningDate = rs.getString("joining_date");
        n.monthlySalary = rs.getDouble("monthly_salary");
        n.perDaySalary = rs.getDouble("per_day_salary");
        n.availability = rs.getString("availability");
        n.photo = rs.getString("photo");
        return n;
    }
}
