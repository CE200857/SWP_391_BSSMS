/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert, InputGroup } from "react-bootstrap";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    setError("");
    setSuccessMsg("");
    const inputEmail = email.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inputEmail)) {
      setError("Vui lòng nhập đúng định dạng Email.");
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await fetch("http://localhost:8080/BSSMS-back/api/forgot-password/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: inputEmail }),
      });

      if (response.ok) {
        setIsEmailVerified(true);
        setCountdown(60);
        setSuccessMsg("Email hợp lệ! Vui lòng nhập mã xác thực được gửi thông qua email");
      } else {
        const data = await response.json();
        setError(data.message || "Email này không tồn tại trong hệ thống.");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    
    const inputEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(inputEmail)) {
      setError("Email không đúng định dạng.");
      return;
    }

    if (!isEmailVerified) {
       setError("Vui lòng nhấn nút Gửi mã trước.");
       return;
    }

    if (verificationCode.trim() !== "123123") {
      setError("Mã xác thực không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
    
    setTimeout(() => {
      navigate("/reset-password", { state: { email: inputEmail } });
    }, 1000);
  };

  return (
    <Container
      className="app-login-surface d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "#fdf6f7" }}
    >
      <Card
        className="shadow-sm"
        style={{ width: "450px", padding: "30px", borderRadius: "12px", border: "none" }}
      >
        <Card.Body>
          <div className="position-relative mb-4">
            <i
              className="bi bi-arrow-left position-absolute"
              style={{
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: "1.5rem",
                color: "#6c757d",
              }}
              onClick={() => navigate("/login")}
              title="Quay lại Đăng nhập"
            ></i>
            <h4 className="text-center fw-bold text-uppercase m-0" style={{ color: "#3a2a2f" }}>
              Quên Mật Khẩu
            </h4>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Form onSubmit={handleConfirm}>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Email*</Form.Label>
              <InputGroup>
                <Form.Control
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false); // Nếu sửa email thì phải gửi mã lại
                  }}
                  required
                />
                <Button 
                  variant={countdown > 0 ? "secondary" : "danger"}
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0 || !email.trim()}
                  style={{ width: "110px", fontWeight: "bold" }}
                >
                  {isSendingCode ? "Đang xử lý" : countdown > 0 ? `${countdown}s` : "Gửi mã"}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Mã xác thực*</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập mã 6 chữ số"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                required
                disabled={!isEmailVerified} // KHÓA ĐẾN KHI EMAIL ĐƯỢC XÁC NHẬN TỒN TẠI VÀ BẤM GỬI
                style={{ backgroundColor: !isEmailVerified ? "#e9ecef" : "white" }}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                className="w-50 fw-bold"
                onClick={() => navigate("/login")}
              >
                Quay lại
              </Button>
              <Button
                variant="danger"
                type="submit"
                className="w-50 fw-bold"
                style={{ backgroundColor: "#a61e4d", border: "none" }}
                disabled={!isEmailVerified || !verificationCode}
              >
                Xác nhận
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;