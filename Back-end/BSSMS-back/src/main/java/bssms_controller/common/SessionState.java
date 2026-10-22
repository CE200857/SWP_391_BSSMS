package bssms_controller.common;

import java.util.*;

/** Session values and pending changes. Only the Servlet writes the actual HttpSession. */
public final class SessionState {
    private final Map<String,Object> values=new HashMap<>(), changes=new HashMap<>();
    private final Set<String> removals=new HashSet<>();
    private boolean invalidated;
    public SessionState(Map<String,Object> original) {
        original.forEach((key,value)->values.put(key, value instanceof Map ? new HashMap<>((Map<?,?>)value) : value));
    }
    public Object get(String key) { return values.get(key); }
    public void set(String key,Object value) { values.put(key,value); changes.put(key,value); removals.remove(key); }
    public void remove(String key) { values.remove(key); changes.remove(key); removals.add(key); }
    public void invalidate() { invalidated=true; values.clear(); changes.clear(); removals.clear(); }
    public boolean invalidated() { return invalidated; }
    public Map<String,Object> changes() { return Collections.unmodifiableMap(changes); }
    public Set<String> removals() { return Collections.unmodifiableSet(removals); }
}
