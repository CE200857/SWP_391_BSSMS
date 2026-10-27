package bssms_account;

/** Typed data exchanged by DAO and controller; nullable fields represent absent SQL values. */
public class Profile implements java.io.Serializable {
    private static final long serialVersionUID = 1L;
    private Integer customerId;
    private String username;
    private String email;
    private String phone;
    private String status;
    private String fullName;
    private java.sql.Date dob;
    private String gender;
    private String address;
    private String role;
    private Integer membershipTierId;
    private MembershipTier membership;

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public java.sql.Date getDob() { return dob; }
    public void setDob(java.sql.Date dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getMembershipTierId() { return membershipTierId; }
    public void setMembershipTierId(Integer membershipTierId) { this.membershipTierId = membershipTierId; }

    public MembershipTier getMembership() { return membership; }
    public void setMembership(MembershipTier membership) { this.membership = membership; }
}
