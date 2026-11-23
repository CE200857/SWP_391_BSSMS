package bssms_controller.common;

import java.time.LocalDate;

public final class InputValidation {
    private InputValidation() {}
    public static void rethrowIfInvalid(Exception e) {
        if(e instanceof IllegalArgumentException || e instanceof NullPointerException
                || e instanceof ClassCastException || e instanceof com.google.gson.JsonParseException
                || e instanceof java.time.format.DateTimeParseException)
            throw new IllegalArgumentException("Invalid request data",e);
    }
    public static String text(String value,String name) {
        if(value==null || value.trim().isEmpty()) throw new IllegalArgumentException(name+" is required");
        return value.trim();
    }
    public static void positive(int value,String name) { if(value<=0) throw new IllegalArgumentException(name+" must be positive"); }
    public static void percent(double value) {
        if(!Double.isFinite(value)||value<=0||value>100) throw new IllegalArgumentException("Percentage must be in (0,100]");
    }
    public static void dates(String start,String end) {
        if(LocalDate.parse(text(end,"endDate")).isBefore(LocalDate.parse(text(start,"startDate"))))
            throw new IllegalArgumentException("End date must not precede start date");
    }
    /** Earliest date of birth accepted anywhere in the system. */
    public static final LocalDate MIN_BIRTH_DATE = LocalDate.of(1900, 1, 1);
    /** Returns an error message for an invalid date of birth, or null when it is empty or valid. */
    public static String birthDateError(String dob) {
        if (dob == null || dob.trim().isEmpty()) return null;
        String value = dob.trim();
        LocalDate d;
        try { d = LocalDate.parse(value.substring(0, Math.min(10, value.length()))); }
        catch (java.time.format.DateTimeParseException e) { return "Invalid date of birth!"; }
        if (d.isBefore(MIN_BIRTH_DATE)) return "Date of birth must be on or after 01/01/1900!";
        if (d.isAfter(LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) return "Date of birth cannot be in the future!";
        return null;
    }
}
