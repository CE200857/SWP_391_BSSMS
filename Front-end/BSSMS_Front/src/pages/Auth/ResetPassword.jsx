/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, newPassword }),
      });

      if (response.ok) {
        setSuccessMsg("Đặt lại mật khẩu thành công! Đang chuyển về Đăng nhập...");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || "Có lỗi xảy ra khi đặt lại mật khẩu.");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ. Vui lòng kiểm tra mạng!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null; 

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
            <h4 className="text-center fw-bold text-uppercase m-0" style={{ color: "#3a2a2f" }}>
              Tạo mật khẩu mới
            </h4>
          </div>

          <p className="text-muted text-center mb-4" style={{ fontSize: "14px" }}>
            Vui lòng nhập mật khẩu mới cho tài khoản: <br/> 
            <strong className="text-danger">{email}</strong>
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Mật khẩu mới*</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập ít nhất 6 ký tự"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading || successMsg !== ""}
              />
            </Form.Group>

            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Xác nhận mật khẩu mới*</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || successMsg !== ""}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                className="w-50 fw-bold"
                onClick={() => navigate("/forgot-password")}
                disabled={isLoading || successMsg !== ""}
              >
                Quay lại
              </Button>
              <Button
                variant="danger"
                type="submit"
                className="w-50 fw-bold"
                style={{ backgroundColor: "#a61e4d", border: "none" }}
                disabled={isLoading || successMsg !== ""}
              >
                {isLoading ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;