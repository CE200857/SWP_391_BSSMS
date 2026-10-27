package bssms_controller.DatTT;

import bssms_account.Account;
import java.util.Arrays;

final class Validation {
    private Validation() {}
    static void body(Object value) {
        if (value == null) throw new IllegalArgumentException("Request body is required.");
    }
    static void id(int value, String field) {
        if (value <= 0) throw new IllegalArgumentException(field + " must be a positive integer.");
    }
    static void optionalId(Integer value, String field) { if (value != null) id(value, field); }
    static String text(String value, String field) {
        if (value == null || value.trim().isEmpty()) throw new IllegalArgumentException(field + " is required.");
        return value.trim();
    }
    static void price(double value) {
        if (!Double.isFinite(value) || value <= 0) throw new IllegalArgumentException("Price must be finite and greater than zero.");
    }
    static String status(String value, String... allowed) {
        if (!Arrays.asList(allowed).contains(value)) throw new IllegalArgumentException("Invalid status.");
        return value;
    }
    static void role(Account user, String... allowed) {
        if (user == null || !Arrays.asList(allowed).contains(user.getRole())) {
            throw new ControllerException(403, "You do not have permission for this operation.");
        }
    }
    static void found(boolean value) {
        if (!value) throw new ControllerException(404, "Record not found.");
    }
}
