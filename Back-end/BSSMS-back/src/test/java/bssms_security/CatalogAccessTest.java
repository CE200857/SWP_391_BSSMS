package bssms_security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.lang.reflect.Proxy;
import java.io.*;

/** Anonymous access boundaries; no database or server required. */
public class CatalogAccessTest {
    static void check(String path,String method,boolean expected) throws Exception {
        boolean[] passed={false}; int[] status={200};
        HttpServletRequest req=(HttpServletRequest)Proxy.newProxyInstance(CatalogAccessTest.class.getClassLoader(),new Class[]{HttpServletRequest.class},(p,m,a)->{
            if(m.getName().equals("getMethod"))return method;
            if(m.getName().equals("getRequestURI"))return "/BSSMS-back"+path;
            if(m.getName().equals("getSession"))return null;
            return null;
        });
        HttpServletResponse res=(HttpServletResponse)Proxy.newProxyInstance(CatalogAccessTest.class.getClassLoader(),new Class[]{HttpServletResponse.class},(p,m,a)->{
            if(m.getName().equals("setStatus"))status[0]=(Integer)a[0];
            if(m.getName().equals("getWriter"))return new PrintWriter(new StringWriter());
            return null;
        });
        new AuthenticationFilter().doFilter(req,res,(r,s)->passed[0]=true);
        if(passed[0]!=expected || (!expected && status[0]!=401))throw new AssertionError(method+" "+path);
    }
    public static void main(String[] args)throws Exception {
        check("/api/treatment-packages","GET",true);
        check("/api/treatment-packages","POST",false);
        check("/api/treatment-packages","PUT",false);
        check("/api/treatment-packages","DELETE",false);
        check("/api/service","GET",true);
        check("/api/booking/slots","GET",false);
        check("/api/booking/online","POST",false);
        System.out.println("PASS: anonymous catalog reads; package writes and booking require login (7 cases).");
    }
}
