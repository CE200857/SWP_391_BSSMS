package bssms_api.common;

import bssms_controller.common.*;
import bssms_persistence.common.DataAccessException;
import com.google.gson.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.sql.SQLException;
import java.util.*;

/** HTTP adapter shared by the newly extracted controllers. */
public abstract class ControllerServlet extends HttpServlet {
    @FunctionalInterface protected interface Action { void run(ActionRequest request,ActionResult result) throws Exception; }
    private void prepare(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin","http://localhost:5173");
        response.setHeader("Access-Control-Allow-Credentials","true");
        response.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS");
        response.setContentType("application/json"); response.setCharacterEncoding("UTF-8");
    }
    @Override protected void doOptions(HttpServletRequest req,HttpServletResponse resp) { prepare(resp); resp.setStatus(200); }
    protected void dispatch(HttpServletRequest request,HttpServletResponse response,Action action) throws IOException {
        prepare(response); request.setCharacterEncoding("UTF-8");
        HttpSession session=request.getSession(false);
        // Serializes session-sensitive operations such as consuming a reset grant.
        synchronized(session==null ? request : session) { execute(request,response,session,action); }
    }
    private void execute(HttpServletRequest request,HttpServletResponse response,HttpSession original,Action action) throws IOException {
        ActionResult result=new ActionResult();
        try {
            Map<String,String> parameters=new HashMap<>();
            request.getParameterMap().forEach((key,values)->parameters.put(key,values.length==0?null:values[0]));
            StringBuilder body=new StringBuilder();
            try(BufferedReader reader=request.getReader()) { String line; while((line=reader.readLine())!=null) body.append(line); }
            String text=body.toString();
            if(("POST".equals(request.getMethod()) || "PUT".equals(request.getMethod())) && !request.getRequestURI().endsWith("/logout")) {
                JsonElement element=JsonParser.parseString(text);
                if(!element.isJsonObject()) throw new IllegalArgumentException("Request body must be a JSON object.");
            }
            Map<String,Object> attrs=new HashMap<>();
            if(original!=null) {
                Enumeration<String> keys=original.getAttributeNames();
                while(keys.hasMoreElements()) {String key=keys.nextElement();attrs.put(key,original.getAttribute(key));}
            }
            ActionRequest input=new ActionRequest(parameters,text,request.getRequestURI(),request.getContextPath(),
                    request.getServletPath(),request.getPathInfo(),request.getQueryString(),original==null?null:new SessionState(attrs));
            action.run(input,result);
            if(result.status()<400) {
                SessionState pending=input.session(false);
                if(pending!=null) {
                    if(pending.invalidated()) { if(original!=null) original.invalidate(); }
                    else if(!pending.changes().isEmpty() || !pending.removals().isEmpty()) {
                        HttpSession actual=request.getSession(true);
                        if(pending.changes().containsKey("user") && (request.getRequestURI().endsWith("/login") || request.getRequestURI().endsWith("/register"))) request.changeSessionId();
                        pending.removals().forEach(actual::removeAttribute);
                        pending.changes().forEach(actual::setAttribute);
                    }
                }
            }
        } catch(DataAccessException | SQLException e) {
            log("Database operation failed",e);
            int code=0;
            for(Throwable cause=e;cause!=null;cause=cause.getCause()) if(cause instanceof SQLException) {code=((SQLException)cause).getErrorCode();break;}
            result.error(code==547 || code==2601 || code==2627 ? 409 : 500,"Không thể lưu hoặc đọc dữ liệu. Vui lòng kiểm tra lại.");
        } catch(JsonParseException | IllegalArgumentException | NullPointerException | ClassCastException e) {
            result.error(400,"Dữ liệu đầu vào thiếu hoặc không hợp lệ.");
        } catch(Exception e) {
            log("Controller operation failed",e);
            result.error(500,"Không thể thực hiện thao tác. Vui lòng thử lại.");
        }
        response.setStatus(result.status());
        response.getWriter().write(result.json());
    }
}
