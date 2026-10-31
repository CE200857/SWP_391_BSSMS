package bssms_persistence.common;
import java.sql.*;
import java.lang.reflect.Proxy;
import java.time.*;

public final class BookingValidationTest {
    static int duration, rollbacks; static boolean auto;
    @SuppressWarnings("unchecked")
    static <T> T proxy(Class<T> type,java.lang.reflect.InvocationHandler handler) {
        return (T)Proxy.newProxyInstance(type.getClassLoader(),new Class[]{type},handler);
    }
    static Connection connection() {
        return proxy(Connection.class,(p,m,a)->{
            switch(m.getName()) {
            case "getAutoCommit":return auto;
            case "setAutoCommit":auto=(Boolean)a[0];return null;
            case "rollback":rollbacks++;return null;
            case "commit":throw new AssertionError("Invalid booking committed");
            case "createStatement":return proxy(Statement.class,(x,n,b)->n.getName().equals("execute")?false:null);
            case "prepareStatement":
                if(auto)throw new AssertionError("Availability read outside transaction");
                if(!((String)a[0]).startsWith("SELECT duration"))throw new AssertionError("Invalid booking reached availability query");
                return proxy(PreparedStatement.class,(x,n,b)->{
                    if(n.getName().equals("executeQuery")) {
                        int[] cursor={0};
                        return proxy(ResultSet.class,(y,k,c)->{
                            if(k.getName().equals("next"))return ++cursor[0]==1;
                            if(k.getName().equals("getInt"))return duration;
                            return null;
                        });
                    }
                    return null;
                });
            default:return null;
            }
        });
    }
    static void rejects(int minutes,String day,String time)throws Exception {
        duration=minutes;auto=true;rollbacks=0;
        try {
            new BookingWorkflow(connection(),3).save(1,1,null,day,time,null,null,null,null);
            throw new AssertionError("Invalid booking accepted");
        } catch(IllegalArgumentException expected) {
            if(!auto || rollbacks!=1)throw new AssertionError("Transaction not restored");
        }
    }
    public static void main(String[] args)throws Exception {
        String future=LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).plusDays(2).toString();
        rejects(0,future,"09:00");rejects(601,future,"09:00");
        rejects(60,"2000-01-01","09:00");
        rejects(60,future,"08:00");rejects(60,future,"18:00");
        System.out.println("PASS: duration, past booking, opening/closing boundaries, transactional read and rollback (5 cases).");
    }
}
