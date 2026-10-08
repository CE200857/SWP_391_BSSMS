import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const inputValue = email.trim(); 

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    const phoneRegex = /^0\d{9}$/; 

    if (!emailRegex.test(inputValue) && !phoneRegex.test(inputValue)) {
      setError("Vui lòng nhập đúng định dạng Email hoặc Số điện thoại (10 chữ số, bắt đầu bằng số 0).");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: inputValue, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data));
        setUser(data);

        setSuccessMsg(
          `Đăng nhập thành công! Chào mừng ${data.fullName} (${data.role})`,
        );

        setTimeout(() => {
          switch (data.role) {
            case "Customer":
              navigate("/customer/home");
              break;

            case "Manager":
              navigate("/manager/dashboard");
              break;

            case "Receptionist":
              navigate("/receptionist/dashboard");
              break;

            case "Technician":
              navigate("/technician/dashboard");
              break;

            default:
              navigate("/bssms-guest");
              break;
          }
        }, 1500);
      } else {
        setError(data.message || "Đăng nhập thất bại!");
        setIsLoading(false);
      }
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Lỗi kết nối đến máy chủ!");
      setIsLoading(false);
    }
  };

  return (
    <Container
      className="app-login-surface d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Card
        className="app-login-card"
        style={{ width: "400px", padding: "20px", border: "none" }}
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
              onClick={() => navigate("/bssms-guest")}
              title="Quay lại trang chủ"
            ></i>

            <h3 className="text-center fw-bold text-uppercase m-0">
              Đăng nhập
            </h3>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3 text-start" controlId="formBasicEmail">
              <Form.Label className="fw-bold">Email hoặc Số điện thoại*</Form.Label>
              <Form.Control
                type="text"
                placeholder="Vui lòng nhập email hoặc sđt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || successMsg !== ""}
              />
            </Form.Group>

            <Form.Group
              className="mb-4 text-start"
              controlId="formBasicPassword"
            >
              <Form.Label className="fw-bold">Mật khẩu*</Form.Label>
              <Form.Control
                type="password"
                placeholder="Vui lòng nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || successMsg !== ""}
              />
            </Form.Group>

            <Button
              variant="danger"
              type="submit"
              className="w-100 mb-4 fw-bold"
              style={{ height: "45px" }}
              disabled={isLoading || successMsg !== ""}
            >
              {isLoading
                ? "Đang xử lý..."
                : successMsg
                  ? "Đang chuyển hướng..."
                  : "Đăng nhập"}
            </Button>
          </Form>

          <div
            className="d-flex flex-column text-start"
            style={{ fontSize: "15px" }}
          >
            <a
              href="/forgot-password"
              style={{
                textDecoration: "none",
                color: "#0d6efd",
                marginBottom: "8px",
              }}
            >
              Forgot Password
            </a>
            <span>
              Chưa có tài khoản?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{
                  textDecoration: "none",
                  color: "#0d6efd",
                  cursor: "pointer",
                }}
              >
                Đăng ký
              </span>
            </span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
