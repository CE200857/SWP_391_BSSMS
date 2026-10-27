package bssms_persistence.common;
public class WorkflowException extends RuntimeException {
    public final int status;
    public WorkflowException(int status,String message) { super(message); this.status=status; }
}
