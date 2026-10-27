package bssms_persistence.common;
import java.sql.*;
import java.util.*;
/** Shared JDBC adapter. All business mutations remain in database procedures. */
public final class Workflow {
    private final Connection conn;
    public final int actor;
    public Workflow(Connection conn,int actor) { this.conn=conn; this.actor=actor; }
    public static int id(Object value) { return ((Number)value).intValue(); }
    @FunctionalInterface
    public interface RowMapper<T> { T map(ResultSet rs) throws SQLException; }
    public <T> List<T> query(RowMapper<T> mapper, String sql, Object... args) throws SQLException {
        if (conn == null) throw new SQLException("Database unavailable");
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i=0; i<args.length; i++) ps.setObject(i+1, args[i]);
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
            for(int i=0;i<args.length;i++) ps.setObject(i+1,args[i]);
            return ps.executeUpdate();
        }
    }
    public List<Map<String,Object>> call(String procedure,Object... args) throws SQLException {
        return call(Workflow::dynamicRow, procedure, args);
    }
    public <T> List<T> call(RowMapper<T> mapper, String procedure,Object... args) throws SQLException {
        if(!procedure.matches("usp_[A-Za-z]+")) throw new IllegalArgumentException("Invalid procedure");
        String marks=String.join(",",Collections.nCopies(args.length,"?"));
        try(CallableStatement ps=conn.prepareCall("{call dbo."+procedure+"("+marks+")}")) {
            for(int i=0;i<args.length;i++) ps.setObject(i+1,args[i]);
            List<T> result=new ArrayList<>();
            boolean hasRows=ps.execute();
            while(true) {
                if(hasRows) { try(ResultSet rs=ps.getResultSet()) { result.addAll(rows(rs, mapper)); } }
                else if(ps.getUpdateCount()==-1) break;
                hasRows=ps.getMoreResults();
            }
            return result;
        } catch(SQLException e) {
            for(SQLException x=e;x!=null;x=x.getNextException()) {
                if(x.getErrorCode()>=51000 && x.getErrorCode()<52000)
                    throw new WorkflowException(x.getErrorCode()==51002?403:409,x.getMessage());
            }
            throw e;
        }
    }
    public void roles(String... allowed) throws SQLException {
        String role=one(rs -> rs.getString("role"), "SELECT role FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " Account WHERE account_id=? AND status='Active'",actor);
        if(!Arrays.asList(allowed).contains(role)) throw new WorkflowException(403,"Role not permitted.");
    }
    public void customerAccess(int customer) throws SQLException {
        if(query("SELECT c.customer_id FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c WHERE c.customer_id=? AND EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND ac.status='Active' AND (ac.role IN ('Receptionist','Manager') OR (ac.role='Customer' AND ac.account_id=c.account_id) OR (ac.role='Technician' AND EXISTS(SELECT 1 FROM Appointment a JOIN AppointmentStaff ast ON ast.appointment_id=a.appointment_id JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id WHERE a.customer_id=c.customer_id AND st.account_id=ac.account_id))))",customer,actor).isEmpty()) throw new WorkflowException(404,"Customer not found.");
    }
    public void appointmentAccess(int id) throws SQLException {
        if(query("SELECT a.appointment_id FROM Appointment a WHERE a.appointment_id=? AND "+appointmentScope(),id,actor).isEmpty())
            throw new WorkflowException(404,"Appointment not found.");
    }
    public static String appointmentScope() {
        return "EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.ACCOUNTS + " ac WHERE ac.account_id=? AND ac.status='Active' AND (ac.role IN ('Manager','Receptionist') OR (ac.role='Customer' AND EXISTS(SELECT 1 FROM " + bssms_persistence.common.SchemaSql.CUSTOMERS + " c WHERE c.customer_id=a.customer_id AND c.account_id=ac.account_id)) OR (ac.role='Technician' AND EXISTS(SELECT 1 FROM AppointmentStaff ast JOIN " + bssms_persistence.common.SchemaSql.STAFF + " st ON st.staff_id=ast.staff_id WHERE ast.appointment_id=a.appointment_id AND st.account_id=ac.account_id))))";
    }
    public interface Work<T> { T run() throws SQLException; }
    public <T> T transaction(Work<T> work) throws SQLException {
        boolean auto=conn.getAutoCommit();
        if(!auto) return work.run();
        conn.setAutoCommit(false);
        try {
            try(Statement lock=conn.createStatement()) {
                // JDBC manual-commit mode may not have started a server transaction yet.
                // A transaction-owned application lock requires an active transaction.
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
    /** Compatibility for report/invoice modules that still have dynamic projections. */
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
