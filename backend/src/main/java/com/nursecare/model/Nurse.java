package com.nursecare.model;

import org.json.JSONObject;

public class Nurse {
    public String id;
    public String fullName;
    public String gender;
    public int age;
    public String nationality;
    public String bloodGroup;
    public String contactNumber;
    public String email;
    public String emergencyContact;
    public String address;
    public String qualification;
    public int experience;
    public String skills;
    public String languages;
    public String certifications;
    public String employeeType;
    public String shiftPreference;
    public String joiningDate;
    public double monthlySalary;
    public double perDaySalary;
    public String availability;
    public String photo;

    public JSONObject toJson() {
        JSONObject o = new JSONObject();
        o.put("id", id);
        o.put("fullName", fullName);
        o.put("gender", gender);
        o.put("age", age);
        o.put("nationality", nationality);
        o.put("bloodGroup", bloodGroup);
        o.put("contactNumber", contactNumber);
        o.put("email", email);
        o.put("emergencyContact", emergencyContact);
        o.put("address", address);
        o.put("qualification", qualification);
        o.put("experience", experience);
        o.put("skills", skills);
        o.put("languages", languages);
        o.put("certifications", certifications);
        o.put("employeeType", employeeType);
        o.put("shiftPreference", shiftPreference);
        o.put("joiningDate", joiningDate);
        o.put("monthlySalary", monthlySalary);
        o.put("perDaySalary", perDaySalary);
        o.put("availability", availability);
        o.put("photo", photo == null ? "" : photo);
        return o;
    }

    public static Nurse fromJson(JSONObject o) {
        Nurse n = new Nurse();
        n.id = o.optString("id", null);
        n.fullName = o.optString("fullName", "");
        n.gender = o.optString("gender", "");
        n.age = o.optInt("age", 0);
        n.nationality = o.optString("nationality", "");
        n.bloodGroup = o.optString("bloodGroup", "");
        n.contactNumber = o.optString("contactNumber", "");
        n.email = o.optString("email", "");
        n.emergencyContact = o.optString("emergencyContact", "");
        n.address = o.optString("address", "");
        n.qualification = o.optString("qualification", "");
        n.experience = o.optInt("experience", 0);
        n.skills = o.optString("skills", "");
        n.languages = o.optString("languages", "");
        n.certifications = o.optString("certifications", "");
        n.employeeType = o.optString("employeeType", "");
        n.shiftPreference = o.optString("shiftPreference", "");
        n.joiningDate = o.optString("joiningDate", "");
        n.monthlySalary = o.optDouble("monthlySalary", 0);
        n.perDaySalary = o.optDouble("perDaySalary", 0);
        n.availability = o.optString("availability", "Available");
        n.photo = o.optString("photo", "");
        return n;
    }
}
