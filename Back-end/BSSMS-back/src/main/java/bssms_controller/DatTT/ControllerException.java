package bssms_controller.DatTT;

/** Expected application failure; the Servlet translates the code to HTTP. */
public class ControllerException extends RuntimeException {
    private final int status;
    public ControllerException(int status, String message) { super(message); this.status = status; }
    public int getStatus() { return status; }
}
