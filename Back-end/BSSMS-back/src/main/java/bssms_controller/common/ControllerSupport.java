package bssms_controller.common;

import bssms_account.Account;
import bssms_common.SessionUsers;
import java.util.ArrayList;
import java.util.List;

/** Request-scoped ownership of DAO connections, including early returns/error paths. */
public abstract class ControllerSupport implements AutoCloseable {
    private final List<AutoCloseable> resources=new ArrayList<>();
    private int actorAccountId;
    protected void bind(ActionRequest request) {
        actorAccountId=0;
        SessionState session=request.session(false);
        Account user = session == null ? null : SessionUsers.from(session.get("user"));
        if (user != null && user.getAccountId() != null) actorAccountId = user.getAccountId();
        for(AutoCloseable resource:resources) attach(resource);
    }
    private void attach(AutoCloseable resource) {
        if(resource instanceof bssms_persistence.DBContext)
            ((bssms_persistence.DBContext)resource).setActorAccountId(actorAccountId);
    }
    protected <T extends AutoCloseable> T use(T resource) { resources.add(resource); attach(resource); return resource; }
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
