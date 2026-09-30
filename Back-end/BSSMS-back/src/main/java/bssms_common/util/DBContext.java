/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.util;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author 
 */
public class DBContext {
    protected Connection conn = null;

    public DBContext() {

        try {

            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");

            String dbURL = "jdbc:sqlserver://localhost:1433;"
                    + "databaseName=BeautySalonDB;"
                    + "user=sa;"
                    + "password=Mytam@260723;"
                    + "encrypt=true;trustServerCertificate=true;";

            conn = DriverManager.getConnection(dbURL);

            if (conn != null) {

                DatabaseMetaData dm = conn.getMetaData();

                System.out.println("Driver name: " + dm.getDriverName());

                System.out.println("Driver version: " + dm.getDriverVersion());

                System.out.println("Product name: "
                        + dm.getDatabaseProductName());

                System.out.println("Product version: "
                        + dm.getDatabaseProductVersion());

            }

        } catch (SQLException ex) {
            System.out.println("Khong ket noi duoc roi em oi!!!!!");
            ex.printStackTrace();
        } catch (ClassNotFoundException ex) {
            Logger.getLogger(DBContext.class.getName()).log(Level.SEVERE, null, ex);
            ex.printStackTrace();
        }

    }
    public static void main(String[] args) {
        DBContext bd = new DBContext();
    }
}
