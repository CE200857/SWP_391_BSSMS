package bssms_common;
import bssms_account.Account;
import java.util.Map;

/** Compatibility boundary for sessions created before typed account models. */
public final class SessionUsers {
    private SessionUsers() {}
    public static Account from(Object value) {
        if (!(value instanceof Account)) return null;
        Account a=(Account)value;
        if(a.getIdentityVersion()!=2 || a.getAccountId()==null) return null;
        try {
            if("Customer".equals(a.getRole())) {
                if(a.getCustomerId()==null || LoginIdentity.customerId(a.getAccountId())!=a.getCustomerId()) return null;
            } else if(a.getStaffId()==null || LoginIdentity.staffId(a.getAccountId())!=a.getStaffId()) return null;
        } catch(IllegalArgumentException e) { return null; }
        return copy(a);
    }
    public static Account copy(Account source) {
        Account copy = new Account();
        copy.setAccountId(source.getAccountId());
        copy.setIdentityVersion(source.getIdentityVersion());
        copy.setCustomerId(source.getCustomerId());
        copy.setStaffId(source.getStaffId());
        copy.setEmail(source.getEmail()); copy.setUsername(source.getUsername());
        copy.setFullName(source.getFullName()); copy.setPhone(source.getPhone());
        copy.setRole(source.getRole()); copy.setStatus(source.getStatus());
        return copy;
    }
    private static String text(Object value) { return value == null ? null : value.toString(); }
    private static Integer id(Map<?,?> values, String key, String legacy) {
        Object value = values.get(key);
        if (value == null) value = values.get(legacy);
        try {
            int id = Integer.parseInt(String.valueOf(value));
            return id > 0 ? id : null;
        } catch (NumberFormatException e) { return null; }
    }
}
