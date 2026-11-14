package bssms_controller.DatTT;

public class ControllerException extends RuntimeException {
    private final int status;
    public ControllerException(int status, String message) { super(message); this.status = status; }
    public int getStatus() { return status; }
}
