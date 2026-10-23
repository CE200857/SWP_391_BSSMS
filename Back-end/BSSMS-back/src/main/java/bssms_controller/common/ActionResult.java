package bssms_controller.common;

import com.google.gson.Gson;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collections;

/** In-memory application result; does not write to a network response. */
public final class ActionResult {
    private int status=200;
    private final StringWriter buffer=new StringWriter();
    private final PrintWriter writer=new PrintWriter(buffer);
    public void status(int code) { status=code; }
    public int status() { return status; }
    public PrintWriter writer() { return writer; }
    public String json() { writer.flush(); return buffer.toString(); }
    public void error(int code,String message) {
        status=code; buffer.getBuffer().setLength(0);
        writer.print(new Gson().toJson(Collections.singletonMap("message",message)));
    }
}
