package bssms_account;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class Account implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer accountId;
    private int identityVersion;
    public int getIdentityVersion() { return identityVersion; }
    public void setIdentityVersion(int value) { identityVersion=value; }
    private String username;
    private transient String password;
    private String email;
    private String phone;
    private String createdAt;
    private String status;
    private String role;
    private String fullName;
    private Integer customerId;
    private Integer staffId;

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public Integer getStaffId() { return staffId; }
    public void setStaffId(Integer staffId) { this.staffId = staffId; }
}
