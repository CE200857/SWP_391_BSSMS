package bssms_controller.common;

import java.util.ArrayList;
import java.util.List;

/** Request-scoped ownership of DAO connections, including early returns/error paths. */
public abstract class ControllerSupport implements AutoCloseable {
    private final List<AutoCloseable> resources=new ArrayList<>();
    protected <T extends AutoCloseable> T use(T resource) { resources.add(resource); return resource; }
    @Override public void close() throws Exception {
        Exception failure=null;
        for(int i=resources.size()-1;i>=0;i--) {
            try { resources.get(i).close(); }
            catch(Exception e) { if(failure==null) failure=e; else failure.addSuppressed(e); }
        }
        resources.clear();
        if(failure!=null) throw failure;
    }
}
