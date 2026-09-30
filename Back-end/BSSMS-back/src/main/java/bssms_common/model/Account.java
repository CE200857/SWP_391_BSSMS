/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package bssms_common.model;

/**
 *
 * @author admin
 */
public class Account {
    // 1. Khai báo các thuộc tính (Tương ứng với các cột trong Database)
    // Nhớ để private để bảo mật dữ liệu (Tính đóng gói - Encapsulation)
    private int accountId;
    private String username;
    private String password;
    private String email;
    private int roleId; // 1: Admin, 2: Manager, 3: Staff, 4: Customer
    private String status; // Active, Inactive

    // 2. Hàm khởi tạo rỗng (Constructor rỗng - Bắt buộc phải có)
    public Account() {
    }

    // 3. Hàm khởi tạo đầy đủ tham số (Giúp gán dữ liệu nhanh)
    public Account(int accountId, String username, String password, String email, int roleId, String status) {
        this.accountId = accountId;
        this.username = username;
        this.password = password;
        this.email = email;
        this.roleId = roleId;
        this.status = status;
    }

    // 4. Các hàm Getter / Setter (Để lấy và sửa giá trị của biến)
    public int getAccountId() {
        return accountId;
    }

    public void setAccountId(int accountId) {
        this.accountId = accountId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getRoleId() {
        return roleId;
    }

    public void setRoleId(int roleId) {
        this.roleId = roleId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
