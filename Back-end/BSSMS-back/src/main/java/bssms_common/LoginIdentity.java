package bssms_common;

public final class LoginIdentity {
    private LoginIdentity() {}
    public static int staff(int id) { if(id<=0) throw new IllegalArgumentException("Invalid staff ID"); return Math.multiplyExact(id,2); }
    public static int customer(int id) { if(id<=0) throw new IllegalArgumentException("Invalid customer ID"); return Math.addExact(Math.multiplyExact(id,2),1); }
    public static int staffId(int accountId) {
        if(accountId<=0 || accountId%2!=0) throw new IllegalArgumentException("Staff identity required");
        return accountId/2;
    }
    public static int customerId(int accountId) {
        if(accountId<=1 || accountId%2!=1) throw new IllegalArgumentException("Customer identity required");
        return accountId/2;
    }
}
