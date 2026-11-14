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
}
