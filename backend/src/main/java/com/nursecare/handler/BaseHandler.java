package com.nursecare.handler;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Common plumbing for every API handler: CORS headers, JSON request/response
 * helpers, and centralized error handling. Subclasses implement route().
 */
public abstract class BaseHandler implements HttpHandler {

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        System.out.println("[REQUEST] " + exchange.getRequestMethod() + " " + exchange.getRequestURI()
                + " from " + exchange.getRemoteAddress());

        addCorsHeaders(exchange);

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try {
            route(exchange);
        } catch (Exception e) {
            e.printStackTrace();
            JSONObject error = new JSONObject();
            error.put("error", e.getMessage() == null ? "Internal server error" : e.getMessage());
            sendJson(exchange, 500, error);
        }
    }

    protected abstract void route(HttpExchange exchange) throws Exception;

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    protected String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    protected JSONObject readJsonBody(HttpExchange exchange) throws IOException {
        String body = readBody(exchange);
        if (body == null || body.isBlank()) return new JSONObject();
        return new JSONObject(body);
    }

    protected void sendJson(HttpExchange exchange, int statusCode, Object payload) throws IOException {
        String json = payload.toString();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    protected String[] pathSegments(HttpExchange exchange) {
        return exchange.getRequestURI().getPath().split("/");
    }
}
