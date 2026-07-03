package com.nursecare.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * Cloud PostgreSQL access. Connection details come from environment
 * variables (set by the hosting platform, e.g. Render + Neon), with
 * local-development fallbacks so `java -jar ...` still works on a
 * developer's machine against a locally reachable Postgres instance.
 */
public final class Database {

    private static final String DB_URL = System.getenv().getOrDefault(
            "DATABASE_URL", "jdbc:postgresql://localhost:5432/nursecare");
    private static final String DB_USER = System.getenv().getOrDefault("DATABASE_USER", "postgres");
    private static final String DB_PASSWORD = System.getenv().getOrDefault("DATABASE_PASSWORD", "postgres");

    private Database() {
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }

    public static void initSchema() {
        String[] statements = {
            """
            CREATE TABLE IF NOT EXISTS nurses (
                id VARCHAR(20) PRIMARY KEY,
                full_name VARCHAR(120) NOT NULL,
                gender VARCHAR(20),
                age INT,
                nationality VARCHAR(60),
                blood_group VARCHAR(10),
                contact_number VARCHAR(20),
                email VARCHAR(120),
                emergency_contact VARCHAR(20),
                address VARCHAR(255),
                qualification VARCHAR(20),
                experience INT,
                skills VARCHAR(255),
                languages VARCHAR(255),
                certifications VARCHAR(255),
                employee_type VARCHAR(20),
                shift_preference VARCHAR(30),
                joining_date VARCHAR(20),
                monthly_salary DOUBLE PRECISION,
                per_day_salary DOUBLE PRECISION,
                availability VARCHAR(20),
                photo TEXT
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS admin_accounts (
                id VARCHAR(20) PRIMARY KEY,
                full_name VARCHAR(120) NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at VARCHAR(40)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS member_accounts (
                id VARCHAR(20) PRIMARY KEY,
                full_name VARCHAR(120) NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password_hash VARCHAR(255) NOT NULL,
                created_at VARCHAR(40)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS bookings (
                id VARCHAR(20) PRIMARY KEY,
                nurse_id VARCHAR(20),
                nurse_name VARCHAR(120),
                nurse_qualification VARCHAR(20),
                member_email VARCHAR(120),
                start_date VARCHAR(20),
                end_date VARCHAR(20),
                duty_hours INT,
                notes VARCHAR(500),
                per_day_salary DOUBLE PRECISION,
                status VARCHAR(20),
                created_at VARCHAR(40)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS contact_messages (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(120),
                email VARCHAR(120),
                subject VARCHAR(120),
                message VARCHAR(1000),
                created_at VARCHAR(40)
            )
            """
        };

        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            for (String sql : statements) {
                stmt.execute(sql);
            }
        } catch (SQLException e) {
            throw new RuntimeException("Failed to initialize database schema", e);
        }
    }
}
