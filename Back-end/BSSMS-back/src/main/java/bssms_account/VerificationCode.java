package bssms_account;

import java.sql.Timestamp;

public class VerificationCode {
    private String email;
    private String otpCode;
    private Timestamp expiryTime;
    private Timestamp createdAt;

    public VerificationCode() {
    }

    public VerificationCode(String email, String otpCode, Timestamp expiryTime, Timestamp createdAt) {
        this.email = email;
        this.otpCode = otpCode;
        this.expiryTime = expiryTime;
        this.createdAt = createdAt;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getOtpCode() {
        return otpCode;
    }

    public void setOtpCode(String otpCode) {
        this.otpCode = otpCode;
    }

    public Timestamp getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(Timestamp expiryTime) {
        this.expiryTime = expiryTime;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }
}