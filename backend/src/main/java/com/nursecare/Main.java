package com.nursecare;

import com.nursecare.db.Database;
import com.nursecare.handler.AdminAuthHandler;
import com.nursecare.handler.BookingHandler;
import com.nursecare.handler.ChatHandler;
import com.nursecare.handler.ContactHandler;
import com.nursecare.handler.MemberAuthHandler;
import com.nursecare.handler.NurseHandler;
import com.nursecare.seed.SeedData;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public class Main {

    public static void main(String[] args) throws Exception {
        Database.initSchema();
        SeedData.seedIfNeeded();
        SeedData.seedDemoAccountsIfNeeded();

        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/nurses", new NurseHandler());
        server.createContext("/api/auth/admin/", new AdminAuthHandler());
        server.createContext("/api/auth/member/", new MemberAuthHandler());
        server.createContext("/api/bookings", new BookingHandler());
        server.createContext("/api/contact", new ContactHandler());
        server.createContext("/api/chat", new ChatHandler());

        server.setExecutor(Executors.newFixedThreadPool(10));
        server.start();

        System.out.println("========================================");
        System.out.println(" Nurse Care Backend running on port " + port);
        System.out.println(" API base: http://localhost:" + port + "/api");
        System.out.println("========================================");
    }
}
