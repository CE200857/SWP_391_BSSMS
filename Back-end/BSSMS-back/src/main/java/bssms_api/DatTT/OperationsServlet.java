package bssms_api.DatTT;
import bssms_api.common.BaseApiServlet;
import bssms_persistence.common.*;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
@WebServlet(urlPatterns="/api/operations/*")
public class OperationsServlet extends BaseApiServlet {
    private OperationsDAO dao(HttpServletRequest request) {
        if(user(request)==null)throw new WorkflowException(401,"Vui lòng đăng nhập.");
        OperationsDAO dao=new OperationsDAO();dao.setActorAccountId(user(request).getAccountId());return dao;
    }
    private String kind(HttpServletRequest request) {return request.getPathInfo()==null?"":request.getPathInfo().substring(1);}
    protected void doGet(HttpServletRequest req,HttpServletResponse res)throws IOException {
        handle(req,res,200,()->{try(OperationsDAO dao=dao(req)){return dao.read(kind(req),req.getParameter("date"));}});
    }
    protected void doPost(HttpServletRequest req,HttpServletResponse res)throws IOException {
        handle(req,res,200,()->{try(OperationsDAO dao=dao(req)){return dao.write(kind(req),body(req,JsonObject.class));}});
    }
}
