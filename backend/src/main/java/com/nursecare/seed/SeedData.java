package com.nursecare.seed;

import com.nursecare.db.Database;
import com.nursecare.model.Nurse;
import com.nursecare.util.PasswordUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;

/**
 * One-time seeding of the same 24 demo nurses used by the frontend's
 * seed-nurses.js, so the backend starts with a consistent, populated
 * database. Skipped automatically if nurses already exist.
 */
public final class SeedData {

    private SeedData() {
    }

    // fullName, qualification, gender, employeeType, availability, age, experience
    private static final String[][] RAW = {
        {"Sarah Jenkins", "RN", "Female", "Full-Time", "Available", "29", "4"},
        {"Michael Chang", "BSN", "Male", "Full-Time", "Available", "34", "7"},
        {"Emily Rodriguez", "NP", "Female", "Full-Time", "Available", "38", "10"},
        {"David Kim", "RN", "Male", "Full-Time", "Available", "27", "3"},
        {"Jessica Taylor", "BSN", "Female", "Full-Time", "Available", "31", "6"},
        {"Amanda Chen", "RN", "Female", "Full-Time", "Available", "26", "2"},
        {"Robert O'Connor", "LPN", "Male", "Full-Time", "Available", "45", "15"},
        {"Lisa Patel", "BSN", "Female", "Full-Time", "Available", "33", "8"},
        {"James Wilson", "RN", "Male", "Full-Time", "Available", "29", "5"},
        {"Sophia Martinez", "NP", "Female", "Full-Time", "On Duty", "41", "12"},
        {"Daniel Jackson", "RN", "Male", "Full-Time", "On Duty", "30", "6"},
        {"Elena Rostova", "BSN", "Female", "Full-Time", "On Leave", "36", "9"},
        {"Karen Thompson", "RN", "Female", "Part-Time", "Available", "40", "11"},
        {"Brian Foster", "LPN", "Male", "Part-Time", "Available", "28", "4"},
        {"Rachel Green", "BSN", "Female", "Part-Time", "Available", "32", "7"},
        {"Marcus Aurelius", "RN", "Male", "Part-Time", "Available", "37", "9"},
        {"Clara Barton", "RN", "Female", "Part-Time", "Available", "44", "14"},
        {"Florence Nightingale", "NP", "Female", "Part-Time", "Available", "39", "13"},
        {"Mary Todd", "BSN", "Female", "Part-Time", "Available", "35", "8"},
        {"John Watson", "RN", "Male", "Part-Time", "Available", "42", "12"},
        {"Sarah Parker", "LPN", "Female", "Part-Time", "Available", "25", "2"},
        {"Lily Evans", "BSN", "Female", "Part-Time", "On Duty", "30", "5"},
        {"Thomas Vance", "RN", "Male", "Part-Time", "On Leave", "46", "16"},
        {"Laura Croft", "BSN", "Female", "Part-Time", "On Leave", "33", "7"},
    };

    private static final String[] NATIONALITIES = {"Indian", "American", "British", "Filipino", "Canadian"};
    private static final String[] BLOOD_GROUPS = {"O+", "A+", "B+", "AB+", "O-", "A-"};
    private static final String[] CITIES = {"Chennai", "Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune"};
    private static final String[] SECOND_LANGUAGES = {"Hindi", "Tamil", "Telugu", "Spanish", "French"};
    private static final String[] SKILL_POOL = {
        "IV Therapy", "Wound Care", "Patient Monitoring", "Medication Administration", "CPR", "Elderly Care", "Pediatric Care"
    };

    public static void seedIfNeeded() {
        try (Connection conn = Database.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS cnt FROM nurses")) {
            rs.next();
            if (rs.getInt("cnt") > 0) return;
        } catch (Exception e) {
            throw new RuntimeException("Failed to check seed status", e);
        }

        for (int i = 0; i < RAW.length; i++) {
            insert(build(RAW[i], i));
        }
        System.out.println("[Seed] Inserted " + RAW.length + " demo nurses.");
    }

    public static void seedDemoAccountsIfNeeded() {
        try (Connection conn = Database.getConnection()) {
            try (PreparedStatement check = conn.prepareStatement("SELECT id FROM admin_accounts WHERE email = ?")) {
                check.setString(1, "admin@hospital.com");
                boolean exists;
                try (ResultSet rs = check.executeQuery()) {
                    exists = rs.next();
                }
                if (!exists) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO admin_accounts (id, full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")) {
                        ps.setString(1, "ADM-DEMO");
                        ps.setString(2, "Demo Administrator");
                        ps.setString(3, "admin@hospital.com");
                        ps.setString(4, PasswordUtil.hash("Admin@1234"));
                        ps.setString(5, Instant.now().toString());
                        ps.executeUpdate();
                        System.out.println("[Seed] Inserted demo admin account (admin@hospital.com).");
                    }
                }
            }

            try (PreparedStatement check = conn.prepareStatement("SELECT id FROM member_accounts WHERE email = ?")) {
                check.setString(1, "member@hospital.com");
                boolean exists;
                try (ResultSet rs = check.executeQuery()) {
                    exists = rs.next();
                }
                if (!exists) {
                    try (PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO member_accounts (id, full_name, email, phone, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")) {
                        ps.setString(1, "MEM-DEMO");
                        ps.setString(2, "Demo Member");
                        ps.setString(3, "member@hospital.com");
                        ps.setString(4, "9999999999");
                        ps.setString(5, PasswordUtil.hash("Member@1234"));
                        ps.setString(6, Instant.now().toString());
                        ps.executeUpdate();
                        System.out.println("[Seed] Inserted demo member account (member@hospital.com).");
                    }
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to seed demo accounts", e);
        }
    }

    private static Nurse build(String[] row, int index) {
        Nurse n = new Nurse();
        n.id = "NUR-S" + String.format("%02d", index + 1);
        n.fullName = row[0];
        n.qualification = row[1];
        n.gender = row[2];
        n.employeeType = row[3];
        n.availability = row[4];
        n.age = Integer.parseInt(row[5]);
        n.experience = Integer.parseInt(row[6]);

        n.nationality = NATIONALITIES[index % NATIONALITIES.length];
        n.bloodGroup = BLOOD_GROUPS[index % BLOOD_GROUPS.length];
        n.contactNumber = "9" + (700000000 + index * 111111);
        String slug = n.fullName.toLowerCase().replaceAll("[^a-z ]", "").trim().replace(" ", ".");
        n.email = slug + "@nursecare.com";
        n.emergencyContact = "9" + (800000000 + index * 111113);
        n.address = (12 + index) + " Wellness Street, " + CITIES[index % CITIES.length];
        n.skills = SKILL_POOL[index % SKILL_POOL.length] + ", " + SKILL_POOL[(index + 3) % SKILL_POOL.length];
        n.languages = "English, " + SECOND_LANGUAGES[index % SECOND_LANGUAGES.length];
        n.certifications = index % 2 == 0 ? "BLS, CPR Certified" : "";
        n.shiftPreference = n.employeeType.equals("Full-Time")
                ? (index % 2 == 0 ? "Day Shift" : "Rotational")
                : (index % 2 == 0 ? "Day Shift" : "Night Shift");

        int joiningYear = 2026 - n.experience;
        n.joiningDate = joiningYear + "-01-15";

        double base = switch (n.qualification) {
            case "RN" -> 28000;
            case "BSN" -> 32000;
            case "NP" -> 45000;
            case "LPN" -> 22000;
            default -> 25000;
        };
        n.monthlySalary = n.employeeType.equals("Full-Time") ? base : Math.round(base * 0.6);
        n.perDaySalary = Math.round(n.monthlySalary / 30);
        n.photo = "";

        return n;
    }

    private static void insert(Nurse n) {
        String sql = """
            INSERT INTO nurses (id, full_name, gender, age, nationality, blood_group, contact_number,
                email, emergency_contact, address, qualification, experience, skills, languages,
                certifications, employee_type, shift_preference, joining_date, monthly_salary,
                per_day_salary, availability, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = Database.getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            int i = 1;
            ps.setString(i++, n.id);
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
            ps.executeUpdate();
        } catch (Exception e) {
            throw new RuntimeException("Failed to seed nurse " + n.fullName, e);
        }
    }
}
