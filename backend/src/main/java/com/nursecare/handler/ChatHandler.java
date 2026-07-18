package com.nursecare.handler;

import com.nursecare.db.Database;
import com.sun.net.httpserver.HttpExchange;
import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.time.Duration;

/**
 * /api/chat   POST — CarePoint AI Assistant.
 * Forwards the member's message (plus recent conversation history and a
 * live snapshot of available nurses) to the Gemini API so it can answer
 * platform questions and recommend real nurses. Falls back to a friendly
 * canned reply if GEMINI_API_KEY isn't configured or the call fails, so the
 * widget never looks broken.
 */
public class ChatHandler extends BaseHandler {

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final String SERVICES = String.join(", ",
            "Home Nursing", "Wound Care", "Infusion", "Catheterization", "Injection", "Stoma Care",
            "Vital Checks", "Vaccination", "Medical Escort", "Respite Care", "Private Nurse (Hourly/Daily)",
            "Part-Time Caregiver", "Elderly Home Care", "Home Care", "Caregiver", "Private Nurse (Monthly)",
            "Intensive Care", "Pulmonary Care", "Dementia Care", "Palliative Care", "Bedridden Patient Care",
            "Rehabilitation Care");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    protected void route(HttpExchange exchange) throws Exception {
        if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, new JSONObject().put("error", "Method not allowed"));
            return;
        }

        JSONObject body = readJsonBody(exchange);
        String message = body.optString("message", "").trim();
        JSONArray history = body.optJSONArray("history");
        if (history == null) history = new JSONArray();

        if (message.isEmpty()) {
            sendJson(exchange, 400, new JSONObject().put("error", "Message is required"));
            return;
        }

        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            sendJson(exchange, 200, new JSONObject()
                    .put("reply", "The AI assistant isn't configured yet — the platform owner needs to set a GEMINI_API_KEY on the server. In the meantime, check the FAQ on the Contact page, or reach support at support@nursecare.com.")
                    .put("configured", false));
            return;
        }

        try {
            String reply = callGemini(apiKey, message, history);
            sendJson(exchange, 200, new JSONObject().put("reply", reply).put("configured", true));
        } catch (Exception e) {
            e.printStackTrace();
            sendJson(exchange, 200, new JSONObject()
                    .put("reply", "Sorry, I'm having trouble responding right now. Please try again in a moment, or use the Contact page for help.")
                    .put("configured", true));
        }
    }

    private String callGemini(String apiKey, String message, JSONArray history) throws Exception {
        JSONObject requestBody = new JSONObject();
        requestBody.put("systemInstruction", new JSONObject()
                .put("parts", new JSONArray().put(new JSONObject().put("text", buildSystemPrompt()))));

        JSONArray contents = new JSONArray();
        for (int i = 0; i < history.length(); i++) {
            JSONObject turn = history.getJSONObject(i);
            String role = "assistant".equals(turn.optString("role")) ? "model" : "user";
            contents.put(new JSONObject()
                    .put("role", role)
                    .put("parts", new JSONArray().put(new JSONObject().put("text", turn.optString("text", "")))));
        }
        contents.put(new JSONObject()
                .put("role", "user")
                .put("parts", new JSONArray().put(new JSONObject().put("text", message))));
        requestBody.put("contents", contents);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GEMINI_URL + apiKey))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("Gemini API returned " + response.statusCode() + ": " + response.body());
        }

        JSONObject json = new JSONObject(response.body());
        return json.getJSONArray("candidates")
                .getJSONObject(0)
                .getJSONObject("content")
                .getJSONArray("parts")
                .getJSONObject(0)
                .getString("text")
                .trim();
    }

    private String buildSystemPrompt() {
        return "You are the CarePoint Assistant, a friendly and concise help chatbot inside the CarePoint mobile "
                + "app — a platform where members (patients/families) book qualified nurses for home healthcare. "
                + "You help members: (1) understand how booking works (browse nurses on Find a Nurse, pick dates, "
                + "submit a request, the admin team confirms it, they get notified of Accepted/Denied status, and "
                + "can rate the nurse afterward), (2) learn about the services offered, and (3) get nurse "
                + "recommendations using the LIVE nurse list below. "
                + "Available services: " + SERVICES + ". "
                + "When recommending nurses, only recommend nurses from the live list provided, mention their name, "
                + "qualification, relevant skill, experience, price per day, and whether they're currently "
                + "Available. If no nurse matches, say so honestly and suggest browsing Find a Nurse with a "
                + "broader filter. Keep answers short (2-5 sentences), warm, and practical — this is a chat widget, "
                + "not an essay. Never invent nurse names, prices, or bookings that aren't in the data given to you.\n\n"
                + "Live nurse list (JSON):\n" + fetchNurseSnapshotSafe();
    }

    private String fetchNurseSnapshotSafe() {
        try {
            return fetchNurseSnapshot().toString();
        } catch (Exception e) {
            return "[]";
        }
    }

    private JSONArray fetchNurseSnapshot() throws Exception {
        JSONArray arr = new JSONArray();
        String sql = "SELECT full_name, qualification, experience, skills, per_day_salary, availability "
                + "FROM nurses WHERE availability = 'Available' ORDER BY experience DESC";
        try (Connection conn = Database.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                JSONObject o = new JSONObject();
                o.put("name", rs.getString("full_name"));
                o.put("qualification", rs.getString("qualification"));
                o.put("experienceYears", rs.getInt("experience"));
                o.put("skills", rs.getString("skills"));
                o.put("perDaySalary", rs.getDouble("per_day_salary"));
                o.put("availability", rs.getString("availability"));
                arr.put(o);
            }
        }
        return arr;
    }
}
