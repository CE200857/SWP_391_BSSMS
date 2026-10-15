import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import axios from "axios";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

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

    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Vui lòng nhập đúng định dạng Email trước khi gửi mã!");
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await axios.post(
        "/api/register",
        {
          action: "send-code",
          username: username.trim(),
          email: trimmedEmail,
        },
        { withCredentials: true },
      );

      if (response.status === 200) {
        setIsCodeSent(true);
        setCountdown(60);
        setSuccessMsg("Mã xác thực đã được gửi tới Email của bạn!");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Không thể gửi mã xác thực. Vui lòng thử lại!",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự!");
      return;
    }
    if (/\s/.test(trimmedUsername)) {
      setError("Tên đăng nhập không được chứa khoảng trắng!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Email không đúng định dạng!");
      return;
    }

    if (!isCodeSent || !verificationCode.trim()) {
      setError("Vui lòng gửi và nhập mã xác thực Email!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "/api/register",
        {
          username: trimmedUsername,
          email: email.trim(),
          password: password,
          verificationCode: verificationCode.trim(),
        },
        { withCredentials: true },
      );

      if (response.status === 201) {
        navigate("/update-profile");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Đăng ký thất bại. Vui lòng kiểm tra lại kết nối server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100 vw-100"
      style={{ backgroundColor: "#fdf6f7" }}
    >
      <Card
        className="p-4 shadow-sm"
        style={{ width: "430px", borderRadius: "12px", border: "none" }}
      >
        <h3 className="text-center mb-4 fw-bold" style={{ color: "#3a2a2f" }}>
          ĐĂNG KÝ
        </h3>

        {error && (
          <Alert variant="danger" className="py-2 text-center fs-6">
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert variant="success" className="py-2 text-center fs-6">
            {successMsg}
          </Alert>
        )}

        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>
              Tên đăng nhập*
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Vui lòng nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ fontSize: "14px", padding: "10px" }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>
              Email*
            </Form.Label>
            <InputGroup>
              <Form.Control
                type="email"
                placeholder="Vui lòng nhập email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsCodeSent(false);
                }}
                required
                style={{ fontSize: "14px", padding: "10px" }}
              />
              <Button
                variant={countdown > 0 ? "secondary" : "danger"}
                onClick={handleSendCode}
                disabled={isSendingCode || countdown > 0 || !email.trim()}
                style={{
                  backgroundColor: countdown > 0 ? undefined : "#a61e4d",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: "bold",
                  width: "105px",
                }}
              >
                {isSendingCode
                  ? "Đang gửi"
                  : countdown > 0
                    ? `${countdown}s`
                    : "Gửi mã"}
              </Button>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>
              Mã xác thực Email*
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Nhập mã 6 chữ số"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              required
              disabled={!isCodeSent}
              style={{
                fontSize: "14px",
                padding: "10px",
                backgroundColor: !isCodeSent ? "#e9ecef" : "white",
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>
              Mật khẩu*
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Vui lòng nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ fontSize: "14px", padding: "10px" }}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>
              Xác nhận mật khẩu*
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Vui lòng xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ fontSize: "14px", padding: "10px" }}
            />
          </Form.Group>

          <Button
            type="submit"
            className="w-100 fw-bold"
            style={{
              backgroundColor: "#a61e4d",
              border: "none",
              borderRadius: "6px",
              padding: "10px",
            }}
            disabled={loading || !isCodeSent}
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </Button>
        </Form>

        <div className="text-center mt-4">
          <span style={{ fontSize: "14px", color: "#6c757d" }}>
            Đã có tài khoản?{" "}
          </span>
          <span
            style={{
              textDecoration: "none",
              color: "#0d6efd",
              cursor: "pointer",
            }}
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </span>
        </div>
      </Card>
    </div>
  );
};

export default Register;
