package bssms_controller.common;

import java.io.BufferedReader;
import java.io.StringReader;
import java.util.Map;

/** Values copied at the Servlet boundary. No Jakarta dependency or live HTTP objects. */
public final class ActionRequest {
    private final Map<String,String> parameters;
    private final String body, uri, contextPath, servletPath, pathInfo, query;
    private SessionState session;
    public ActionRequest(Map<String,String> parameters, String body, String uri, String contextPath,
            String servletPath, String pathInfo, String query, SessionState session) {
        this.parameters=parameters; this.body=body; this.uri=uri; this.contextPath=contextPath;
        this.servletPath=servletPath; this.pathInfo=pathInfo; this.query=query; this.session=session;
    }
    public String parameter(String name) { return parameters.get(name); }
    public BufferedReader bodyReader() { return new BufferedReader(new StringReader(body)); }
    public String uri() { return uri; }
    public String contextPath() { return contextPath; }
    public String servletPath() { return servletPath; }
    public String pathInfo() { return pathInfo; }
    public String queryString() { return query; }
    public SessionState session(boolean create) {
        if (session == null && create) session=new SessionState(java.util.Collections.emptyMap());
        return session;
    }
}
