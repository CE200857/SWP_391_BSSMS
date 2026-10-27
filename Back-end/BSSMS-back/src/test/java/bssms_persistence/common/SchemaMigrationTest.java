package bssms_persistence.common;

import bssms_account.Account;
import bssms_common.LoginIdentity;
import bssms_common.SessionUsers;
import bssms_persistence.DatNT.RegisterDAO;
import bssms_persistence.DatNT.ProfileDAO;
import bssms_persistence.HienLNM.FeedbackDAO;
import bssms_feedback.Feedback;
import java.sql.*;
import java.util.*;
import java.util.logging.Logger;
import java.lang.reflect.*;
import com.google.gson.Gson;

/** JDBC-boundary regression checks. These do not execute SQL Server procedures. */
public final class SchemaMigrationTest {
    static String role="Customer",lastWrite;
    static int updateCount=1;
    static Map<Integer,Object> lastArgs;
    static final List<String> queries=new ArrayList<>();
    interface Handler { Object run(String name,Object[] args) throws Throwable; }
    @SuppressWarnings("unchecked")
    static <T> T proxy(Class<T> c,Handler h) {
        return (T)Proxy.newProxyInstance(c.getClassLoader(),new Class<?>[]{c},(o,m,a)->h.run(m.getName(),a));
    }
    static void check(boolean test,String message) {if(!test)throw new AssertionError(message);}
    static ResultSet rows(String sql) {
        Map<String,Object> row=new LinkedHashMap<>();
        boolean customer="Customer".equals(role);
        row.put("account_id",customer?3:2); row.put("customer_id",customer?1:null);row.put("staff_id",customer?null:1);
        row.put("username","sample");row.put("email","test@example.test");row.put("phone","0999999999");
        row.put("full_name","Test User");row.put("role",role);row.put("status","Active");row.put("appointment_id",10);
        List<String> keys=new ArrayList<>(row.keySet());int[] cursor={0};
        ResultSetMetaData md=proxy(ResultSetMetaData.class,(m,a)->m.equals("getColumnCount")?keys.size():m.equals("getColumnLabel")?keys.get((int)a[0]-1):null);
        return proxy(ResultSet.class,(m,a)->{
            if(m.equals("next"))return ++cursor[0]==1;
            if(m.equals("getMetaData"))return md;
            if(m.equals("close"))return null;
            Object v=row.get(a[0] instanceof Integer?keys.get((int)a[0]-1):a[0]);
            if(m.equals("getInt"))return v==null?0:((Number)v).intValue();
            if(m.equals("getString"))return v==null?null:v.toString();
            if(m.equals("getObject"))return v;
            return null;
        });
    }
    static Connection connection() {
        boolean[] auto={true};
        return proxy(Connection.class,(m,a)->{
            if(m.equals("getMetaData"))return proxy(DatabaseMetaData.class,(n,b)->"offline test");
            if(m.equals("isClosed"))return false;
            if(m.equals("getAutoCommit"))return auto[0];
            if(m.equals("setAutoCommit")){auto[0]=(boolean)a[0];return null;}
            if(m.equals("createStatement"))return proxy(Statement.class,(n,b)->n.equals("execute")?false:null);
            if(m.equals("prepareStatement")) {
                String sql=(String)a[0];queries.add(sql);Map<Integer,Object> args=new TreeMap<>();
                return proxy(PreparedStatement.class,(n,b)->{
                    if(n.startsWith("set")){args.put((Integer)b[0],b.length>1?b[1]:null);return null;}
                    if(n.equals("executeUpdate")){lastWrite=sql;lastArgs=args;return updateCount;}
                    if(n.equals("executeQuery"))return rows(sql);
                    return null;
                });
            }
            return null;
        });
    }
    public static void main(String[] args) throws Exception {
        DriverManager.registerDriver(new Driver(){
            public Connection connect(String url,Properties info){return acceptsURL(url)?connection():null;}
            public boolean acceptsURL(String url){return url.startsWith("jdbc:bssms-test:");}
            public DriverPropertyInfo[] getPropertyInfo(String u,Properties p){return new DriverPropertyInfo[0];}
            public int getMajorVersion(){return 1;}public int getMinorVersion(){return 0;}
            public boolean jdbcCompliant(){return false;}public Logger getParentLogger(){return Logger.getGlobal();}
        });
        check(LoginIdentity.staff(1)!=LoginIdentity.customer(1),"native IDs must not collide");
        try {LoginIdentity.staffId(LoginIdentity.customer(1));throw new AssertionError();}catch(IllegalArgumentException expected){}
        try {LoginIdentity.customerId(LoginIdentity.staff(1));throw new AssertionError();}catch(IllegalArgumentException expected){}
        try(RegisterDAO dao=new RegisterDAO()) {
            for(String r:Arrays.asList("Customer","Manager","Receptionist","Technician")) {
                role=r;Account user=dao.authenticateUser("test@example.test","hash");
                check(user.getIdentityVersion()==2 && r.equals(user.getRole()),"typed login role");
                check(SessionUsers.from(user)!=null,"current session accepted");
                check("Customer".equals(r)?user.getCustomerId()==1 && user.getStaffId()==null:user.getStaffId()==1 && user.getCustomerId()==null,"typed owner ID");
                user.setPassword("secret"); check(!new Gson().toJson(user).contains("secret"),"password excluded from JSON");
                check(SessionUsers.copy(user).getIdentityVersion()==2,"session snapshot version");
                user.setIdentityVersion(0);check(SessionUsers.from(user)==null,"legacy typed session rejected");
            }
            check(SessionUsers.from(Map.of("accountId",2,"role","Manager"))==null,"legacy map cannot be reinterpreted as V2");
            dao.changePassword(3,"old","new");
            check(lastWrite.startsWith("UPDATE Customer") && lastArgs.get(2).equals(1),"customer password updates native customer ID");
            dao.changePassword(2,"old","new");
            check(lastWrite.startsWith("UPDATE Staff") && lastArgs.get(2).equals(1),"staff password updates native staff ID");
            dao.createAccount("newuser","hash","new@example.test");
            check(lastWrite.startsWith("INSERT Customer") && lastArgs.get(4).equals("newuser"),"registration writes one owner row");
        }
        try(ProfileDAO dao=new ProfileDAO()) {
            dao.createCustomerProfile(3,"Full Name","2000-01-01","Male","0999999999","Address");
            check(lastWrite.startsWith("UPDATE Customer") && lastArgs.get(6).equals(1),"complete profile updates registered customer");
        }
        role="Customer";
        try(FeedbackDAO dao=new FeedbackDAO()) {
            dao.setActorAccountId(3);
            Feedback fb=new Feedback();fb.setCustomerId(1);fb.setAppointmentId(10);fb.setRating(5);fb.setComment("Good");
            dao.addFeedback(fb);
            check(lastWrite.startsWith("UPDATE Appointment") && lastWrite.contains("feedback_id IS NULL"),"atomic feedback creation");
            check(lastArgs.get(3).equals(10) && lastArgs.get(4).equals(1),"feedback owner and appointment bound");
            updateCount=0;
            try {dao.addFeedback(fb);throw new AssertionError("duplicate feedback accepted");} catch(WorkflowException e){check(e.status==409,"duplicate feedback conflict");}
            updateCount=1;
            dao.deleteFeedback(1);
            check(lastWrite.startsWith("UPDATE Appointment SET feedback_id=NULL") && !lastWrite.contains("result_notes="),"feedback deletion preserves treatment");
        }
        for(String sql:queries)check(!sql.matches("(?is).*\\b(?:FROM|JOIN|UPDATE|INTO)\\s+(?:Account|Feedback|TreatmentRecord|InvoicePackage)\\b.*"),"removed physical table referenced");
        System.out.println("PASS: four login roles, owner IDs, legacy-session rejection, secret serialization, password/profile routing, feedback ownership and duplicate-write conflict.");
    }
}
