package bssms_common;

public final class LoginIdentity {

    private LoginIdentity() {
    }
    
    /*
    Calculate staff and customer id from database into accountId to save into session
    Prevent the customer to use staff function and staff to use customer function
    Because in database id of staff and customer save as staffId and CustomerId
    While in session the id save as accountId
    */
    public static int staff(int id) {
        if (id <= 0) {
            throw new IllegalArgumentException("Invalid staff ID");
        }
        return Math.multiplyExact(id, 2); // StaffId will calculate into even number like 2 4
    }

    public static int customer(int id) {
        if (id <= 0) {
            throw new IllegalArgumentException("Invalid customer ID");
        }
        return Math.addExact(Math.multiplyExact(id, 2), 1); // CustomerId will calculate into odd number like 3 5
    }
    
    /*
    Caculate accountId from session back to StaffId and CustomerId to use for database like update or compare
    */
    public static int staffId(int accountId) {
        if (accountId <= 0 || accountId % 2 != 0) {
            throw new IllegalArgumentException("Staff identity required");
        }
        return accountId / 2; // accountId of Staff will calculate back by divided by 2
    }

    public static int customerId(int accountId) {
        if (accountId <= 1 || accountId % 2 != 1) {
            throw new IllegalArgumentException("Customer identity required");
        }
        return accountId / 2; // accountId of Customer also calculate back by divided by 2 because it use integer number so number like 5 will round to 2
    }
}
