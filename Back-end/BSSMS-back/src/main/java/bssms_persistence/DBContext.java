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
                + "trustServerCertificate=true;";

        String username = "sa";
        String password = "123456";

        dbURL = setting("bssms.db.url", "BSSMS_DB_URL", dbURL);
        username = setting("bssms.db.user", "BSSMS_DB_USER", username);
        password = setting("bssms.db.password", "BSSMS_DB_PASSWORD", password);

        try {
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
            conn = DriverManager.getConnection(dbURL, username, password);
        } catch (ClassNotFoundException ex) {
            throw new IllegalStateException(
                    "Không tìm thấy SQL Server JDBC Driver.", ex);
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
                System.out.println("Kết nối SQL Server thành công!");
                System.out.println(
                        "Database đang kết nối: " + connection.getCatalog());
            } else {
                throw new IllegalStateException(
                        "Kết nối SQL Server không hợp lệ.");
            }
        } catch (SQLException ex) {
            throw new DataAccessException(ex);
        }
    }
}