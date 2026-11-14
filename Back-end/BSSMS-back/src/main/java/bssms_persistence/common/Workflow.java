package bssms_persistence.common;
import java.sql.*;
import java.util.*;
public final class Workflow {
    private final Connection conn;
    public final int actor;
    public Workflow(Connection conn,int actor) { this.conn=conn; this.actor=actor; }
    public static int id(Object value) { return ((Number)value).intValue(); }
    private static void bind(PreparedStatement ps, Object[] args) throws SQLException {
        for (int i=0; i<args.length; i++) {
            Object v = args[i];
            if (v instanceof java.sql.Time) ps.setString(i+1, v.toString());
            else if (v instanceof java.time.LocalTime) ps.setString(i+1, java.sql.Time.valueOf((java.time.LocalTime) v).toString());
            else ps.setObject(i+1, v);
        }
    }
    @FunctionalInterface
    public interface RowMapper<T> { T map(ResultSet rs) throws SQLException; }
    public <T> List<T> query(RowMapper<T> mapper, String sql, Object... args) throws SQLException {
        if (conn == null) throw new SQLException("Database unavailable");
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bind(ps, args);
            try (ResultSet rs = ps.executeQuery()) { return rows(rs, mapper); }
        }
    }
    public <T> T one(RowMapper<T> mapper, String sql, Object... args) throws SQLException {
        List<T> values = query(mapper, sql, args);
        if (values.isEmpty()) throw new WorkflowException(404, "Record not found.");
        return values.get(0);
    }
    private static <T> List<T> rows(ResultSet rs, RowMapper<T> mapper) throws SQLException {
        List<T> values = new ArrayList<>();
        while (rs.next()) values.add(mapper.map(rs));
        return values;
    }
    public List<Map<String,Object>> query(String sql,Object... args) throws SQLException {
        return query(Workflow::dynamicRow, sql, args);
    }
    public Map<String,Object> one(String sql,Object... args) throws SQLException {
        List<Map<String,Object>> list=query(sql,args);
        if(list.isEmpty()) throw new WorkflowException(404,"Record not found.");
        return list.get(0);
    }
    public int update(String sql,Object... args) throws SQLException {
        try(PreparedStatement ps=conn.prepareStatement(sql)) {
            bind(ps, args);
            return ps.executeUpdate();
        }
    }
    public void roles(String... allowed) throws SQLException {
        String role=one(rs -> rs.getString("role"), "SELECT role FROM " + SchemaSql.ACCOUNTS + " Account WHERE account_id=? AND status='Active'",actor);
        if(!Arrays.asList(allowed).contains(role)) throw new WorkflowException(403,"Role not permitted.");
    }
    public void customerAccess(int customer) throws SQLException {
        if(query("SELECT c.customer_id FROM " + SchemaSql.CUSTOMERS + " c WHERE c.customer_id=? AND EXISTS(SELECT 1 FROM " + SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND ac.status='Active' AND (ac.role IN ('Receptionist','Manager') OR (ac.role='Customer' AND ac.customer_id=c.customer_id) OR (ac.role='Technician' AND EXISTS(SELECT 1 FROM Appointment a JOIN AppointmentService l ON l.appointment_id=a.appointment_id WHERE a.customer_id=c.customer_id AND l.technician_id=ac.staff_id))))",customer,actor).isEmpty()) throw new WorkflowException(404,"Customer not found.");
    }
    public void appointmentAccess(int id) throws SQLException {
        if(query("SELECT a.appointment_id FROM Appointment a WHERE a.appointment_id=? AND "+appointmentScope(),id,actor).isEmpty())
            throw new WorkflowException(404,"Appointment not found.");
    }
    public static String appointmentScope() {
        return "EXISTS(SELECT 1 FROM " + SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND ac.status='Active' AND (ac.role IN ('Manager','Receptionist') OR (ac.role='Customer' AND ac.customer_id=a.customer_id) OR (ac.role='Technician' AND EXISTS(SELECT 1 FROM AppointmentService l WHERE l.appointment_id=a.appointment_id AND l.technician_id=ac.staff_id))))";
    }
    public int staffId() { return bssms_common.LoginIdentity.staffId(actor); }
    public int customerId() { return bssms_common.LoginIdentity.customerId(actor); }
    public String role() throws SQLException {
        return one(rs -> rs.getString("role"), "SELECT role FROM " + SchemaSql.ACCOUNTS + " Account WHERE account_id=? AND status='Active'",actor);
    }
    public void history(int appointment,String oldStatus,String newStatus,String reason) throws SQLException {
        update("INSERT INTO AppointmentStatusHistory(appointment_id,old_status,new_status,changed_at,reason) VALUES(?,?,?,SYSDATETIME(),?)",appointment,oldStatus,newStatus,reason);
    }
    public int insert(String sql,Object... args) throws SQLException {
        try(PreparedStatement ps=conn.prepareStatement(sql,Statement.RETURN_GENERATED_KEYS)) {
            bind(ps, args);
            ps.executeUpdate();
            try(ResultSet keys=ps.getGeneratedKeys()) { if(keys.next()) return keys.getInt(1); }
        }
        throw new SQLException("No generated key");
    }
    public interface Work<T> { T run() throws SQLException; }
    public <T> T transaction(Work<T> work) throws SQLException {
        boolean auto=conn.getAutoCommit();
        if(!auto) return work.run();
        conn.setAutoCommit(false);
        try {
            try(Statement lock=conn.createStatement()) {
                lock.execute("IF @@TRANCOUNT=0 BEGIN TRANSACTION; "
                    + "DECLARE @r int; EXEC @r=sys.sp_getapplock "
                    + "@Resource='BSSMS_WORKFLOW',@LockMode='Exclusive',"
                    + "@LockOwner='Transaction',@LockTimeout=10000; "
                    + "IF @r<0 BEGIN "
                    + "DECLARE @message nvarchar(2048)=CONCAT('Cannot acquire BSSMS_WORKFLOW lock. Return code: ',@r); "
                    + "THROW 51001,@message,1; END;");
            }
            T result=work.run(); conn.commit(); return result;
        }
        catch(SQLException|RuntimeException e) { try {conn.rollback();} catch(SQLException x){e.addSuppressed(x);} throw e; }
        finally {conn.setAutoCommit(auto);}
    }
    private static Map<String,Object> dynamicRow(ResultSet rs) throws SQLException {
        Map<String,Object> row = new LinkedHashMap<>();
        ResultSetMetaData md = rs.getMetaData();
        for (int i=1; i<=md.getColumnCount(); i++) {
            String key=md.getColumnLabel(i);
            StringBuilder camel=new StringBuilder(); boolean upper=false;
            for(char c:key.toCharArray()) {
                if(c=='_'){upper=true;continue;}
                camel.append(upper?Character.toUpperCase(c):c);upper=false;
            }
            Object value=rs.getObject(i);
            if(value instanceof java.util.Date || value instanceof java.time.temporal.TemporalAccessor)
                value=value.toString();
            row.put(camel.toString(),value);
        }
        return row;
    }
}
