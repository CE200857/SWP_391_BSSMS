package bssms_account;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class Staff implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer staffId;
    private Integer accountId;
    private String username;
    private String fullName;
    private String phone;
    private String email;
    private String position;
    private String role;
    private java.math.BigDecimal salary;
    private String hireDate;
    private String status;
    private Boolean hasSkill;
    private Boolean isFree;
    private Boolean isSuggested;

    public Integer getStaffId() { return staffId; }
    public void setStaffId(Integer staffId) { this.staffId = staffId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public java.math.BigDecimal getSalary() { return salary; }
    public void setSalary(java.math.BigDecimal salary) { this.salary = salary; }

    public String getHireDate() { return hireDate; }
    public void setHireDate(String hireDate) { this.hireDate = hireDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getHasSkill() { return hasSkill; }
    public void setHasSkill(Boolean hasSkill) { this.hasSkill = hasSkill; }

    public Boolean getIsFree() { return isFree; }
    public void setIsFree(Boolean isFree) { this.isFree = isFree; }

    public Boolean getIsSuggested() { return isSuggested; }
    public void setIsSuggested(Boolean isSuggested) { this.isSuggested = isSuggested; }
}
