package bssms_common;

import bssms_account.Account;

public final class SessionUsers {

    private SessionUsers() {
    }

    public static Account from(Object value) { // Get the account from session
        if (!(value instanceof Account)) {
            return null;
        }
        Account a = (Account) value;
        if (a.getIdentityVersion() != 2 || a.getAccountId() == null) { // Check if session is correct for current version (2) and if account have accountID
            return null;
        }
        try { // Check Role
            if ("Customer".equals(a.getRole())) {
                if (a.getCustomerId() == null || LoginIdentity.customerId(a.getAccountId()) != a.getCustomerId()) {
                    return null;
                }
            } else if (a.getStaffId() == null || LoginIdentity.staffId(a.getAccountId()) != a.getStaffId()) {
                return null;
            }
        } catch (IllegalArgumentException e) {
            return null;
        }
        return copy(a);
    }

    /*
    Copy another account to prevent error during update account in session
    For example: if update have error, this methods will only update itself and prevent from update to session
    Keeping the information in session safe and not updating to new error infomation
    */
    public static Account copy(Account source) {
        Account copy = new Account();
        copy.setAccountId(source.getAccountId());
        copy.setIdentityVersion(source.getIdentityVersion());
        copy.setCustomerId(source.getCustomerId());
        copy.setStaffId(source.getStaffId());
        copy.setEmail(source.getEmail());
        copy.setUsername(source.getUsername());
        copy.setFullName(source.getFullName());
        copy.setPhone(source.getPhone());
        copy.setRole(source.getRole());
        copy.setStatus(source.getStatus());
        return copy;
    }
}
