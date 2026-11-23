package bssms_persistence;

import bssms_persistence.common.DataAccessException;
import bssms_persistence.common.Workflow;
import bssms_persistence.common.WorkflowException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBContext {

    protected Connection conn = null;
    private int actorAccountId;

    public void setActorAccountId(int id) {
        actorAccountId = id;
    }

    protected int requireActorAccountId() {
        if (actorAccountId <= 0) {
            throw new WorkflowException(403, "Please log in again.");
        }
        return actorAccountId;
    }

    protected Workflow workflow() {
        return new Workflow(conn, requireActorAccountId());
    }

    public DBContext() {
        String dbURL = "jdbc:sqlserver://localhost:1433;"
                + "databaseName=BeautySalonDB;"
                + "encrypt=true;"
                + "trustServerCertificate=true;"
                + "sendTimeAsDatetime=false;";

        String username = "sa";
        String password = "Mytam@260723";

        dbURL = setting("bssms.db.url", "BSSMS_DB_URL", dbURL);
        username = setting("bssms.db.user", "BSSMS_DB_USER", username);
        password = setting("bssms.db.password", "BSSMS_DB_PASSWORD", password);

        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            conn = ConnectionPool.get(dbURL, username, password);
        } catch (ClassNotFoundException ex) {
            throw new IllegalStateException(
                    "SQL Server JDBC Driver not found.", ex);
        } catch (SQLException ex) {
            throw new DataAccessException(ex);
        }
    }

    private static String setting(String property, String environment, String fallback) {
        String value = System.getProperty(property);
        if (value == null) value = System.getenv(environment);
        return value == null ? fallback : value;
    }

    public static void main(String[] args) {
        DBContext db = new DBContext();

        try (Connection connection = db.conn) {
            if (connection != null && connection.isValid(5)) {
                System.out.println("Connected to SQL Server successfully!");
                System.out.println(
                        "Connected database: " + connection.getCatalog());
            } else {
                throw new IllegalStateException(
                        "Invalid SQL Server connection.");
            }
        } catch (SQLException ex) {
            throw new DataAccessException(ex);
        }
    }
}