package bssms_security;

import java.util.Properties;
import java.util.Random;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

public class EmailUtil {

    public static final String FROM_EMAIL = "zonestevegamer1@gmail.com";
    private static final String APP_PASSWORD = "fvlv fomk rurw ckts";

    public static String generateOTP() {
        Random rnd = new Random();
        int number = 100000 + rnd.nextInt(900000);
        return String.valueOf(number);
    }

    public static boolean sendOTP(String toEmail, String otpCode, String subjectTitle) {
        System.out.println("==========================================");
        System.out.println("[OTP LOG] Email: " + toEmail + " | Mã xác thực: " + otpCode);
        System.out.println("==========================================");

        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(FROM_EMAIL, APP_PASSWORD);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(FROM_EMAIL, "Beauty Salon Management System", "UTF-8"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subjectTitle);
            
            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>"
                    + "<h3 style='color: #a61e4d;'>Xác thực tài khoản BSSMS</h3>"
                    + "<p>Mã xác thực (OTP) của bạn là:</p>"
                    + "<h2 style='color: #3a2a2f; letter-spacing: 4px; background: #fdf6f7; padding: 10px 20px; display: inline-block; border-radius: 6px;'>" 
                    + otpCode + "</h2>"
                    + "<p>Mã này có hiệu lực trong vòng <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>"
                    + "</div>";

            message.setContent(htmlContent, "text/html; charset=UTF-8");
            Transport.send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Không gửi được qua SMTP (hãy kiểm tra lại App Password), dùng mã ở Console để test: " + otpCode);
            return false;
        }
    }
}