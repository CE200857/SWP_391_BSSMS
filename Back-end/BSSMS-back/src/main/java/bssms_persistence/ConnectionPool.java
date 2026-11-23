package bssms_persistence;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentLinkedDeque;

final class ConnectionPool {
    private static final int MAX_IDLE = 20;
    private static final long CHECK_AFTER_MS = 30_000;
    private static final ConcurrentLinkedDeque<Idle> IDLE = new ConcurrentLinkedDeque<>();

    private static final class Idle {
        final Connection real;
        final long since;
        Idle(Connection real, long since) { this.real = real; this.since = since; }
    }

    private ConnectionPool() {}

    static Connection get(String url, String user, String password) throws SQLException {
        Idle idle;
        while ((idle = IDLE.pollFirst()) != null) {
            Connection real = idle.real;
            try {
                if (System.currentTimeMillis() - idle.since < CHECK_AFTER_MS || real.isValid(2)) return wrap(real);
            } catch (SQLException ignored) {
            }
            quietClose(real);
        }
        return wrap(DriverManager.getConnection(url, user, password));
    }

    private static Connection wrap(Connection real) {
        boolean[] closed = {false};
        return (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(), new Class<?>[]{Connection.class}, (proxy, method, args) -> {
            switch (method.getName()) {
                case "close":
                    if (!closed[0]) { closed[0] = true; release(real); }
                    return null;
                case "isClosed":
                    return closed[0] || real.isClosed();
                case "unwrap":
                    return ((Class<?>) args[0]).isInstance(real) ? real : real.unwrap((Class<?>) args[0]);
                default:
                    if (closed[0]) throw new SQLException("Connection is closed");
                    try { return method.invoke(real, args); }
                    catch (InvocationTargetException e) { throw e.getCause(); }
            }
        });
    }

    private static void release(Connection real) {
        try {
            if (real.isClosed()) return;
            if (!real.getAutoCommit()) { real.rollback(); real.setAutoCommit(true); }
            real.clearWarnings();
            if (IDLE.size() < MAX_IDLE) { IDLE.addFirst(new Idle(real, System.currentTimeMillis())); return; }
        } catch (SQLException ignored) {
        }
        quietClose(real);
    }

    private static void quietClose(Connection c) {
        try { c.close(); } catch (SQLException ignored) {}
    }
}
