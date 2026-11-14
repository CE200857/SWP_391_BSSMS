package bssms_persistence.common;

public final class DataAccessException extends RuntimeException {
    public DataAccessException(String message) { super(message); }
    public DataAccessException(Throwable cause) { super("Database operation failed",cause); }
    public static void rethrowIfDatabase(Throwable error) {
        if(error instanceof WorkflowException) throw (WorkflowException)error;
        for(Throwable current=error;current!=null;current=current.getCause()) {
            if(current instanceof DataAccessException) throw (DataAccessException)current;
            if(current instanceof java.sql.SQLException) throw new DataAccessException(error);
        }
    }
}
