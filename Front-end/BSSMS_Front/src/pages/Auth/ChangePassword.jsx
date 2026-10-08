import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Validate mật khẩu
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (oldPassword === newPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/BSSMS-back/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Cực kỳ quan trọng để giữ Session
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || "Đổi mật khẩu thành công!");
        // Làm sạch form
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Tùy chọn: Chuyển hướng về Profile sau 2 giây
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } else {
        setError(data.message || "Đổi mật khẩu thất bại!");
      }
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <Card className="shadow-sm border-0" style={{ width: "450px", borderRadius: "12px", padding: "30px" }}>
        <h3 className="text-center mb-4 fw-bold text-uppercase" style={{ color: "#3a2a2f" }}>
          Đổi mật khẩu
        </h3>

        {error && <Alert variant="danger">{error}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Mật khẩu hiện tại*</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={isLoading || successMsg !== ""}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Mật khẩu mới*</Form.Label>
            <Form.Control
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading || successMsg !== ""}
            />
          </Form.Group>

          <Form.Group className="mb-4">
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

          <div className="d-flex gap-3">
            <Button
              variant="outline-secondary"
              className="fw-bold w-50"
              onClick={() => navigate(-1)} // Nút quay lại
              disabled={isLoading}
            >
              <i className="bi bi-arrow-left me-1"></i> Quay lại
            </Button>

            <Button
              type="submit"
              className="fw-bold w-50 text-white"
              style={{ backgroundColor: "#a61e4d", border: "none" }}
              disabled={isLoading || successMsg !== ""}
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận đổi"}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default ChangePassword;