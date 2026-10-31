import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import spaPhoto from "../../assets/figma/login-spa-original.jpeg";

import { loginAccount, loginDestination, roleHome } from "../../auth/login";

const Login = ({ user, setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  if (user) return <Navigate to={roleHome(user.role)} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const inputValue = email.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0\d{9}$/;

    if (!emailRegex.test(inputValue) && !phoneRegex.test(inputValue)) {
      setError(
        "Vui lòng nhập đúng định dạng Email hoặc Số điện thoại (10 chữ số, bắt đầu bằng số 0)."
      );
      return;
    }

    setIsLoading(true);

    try {
      const data = await loginAccount(inputValue, password, 'customer');
      localStorage.setItem('user', JSON.stringify(data));
      sessionStorage.removeItem('bssms.pendingBooking');
      setUser(data);
      navigate(loginDestination(data.role, location.state?.from), { replace: true });
    } catch (err) {
      localStorage.removeItem('user');
      setUser(null);
      setError(err.message || 'Lỗi kết nối đến máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      className="app-login-surface d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="auth-page-grid">
        <section className="auth-page-intro">
          <span className="home-eyebrow">CHÀO MỪNG TRỞ LẠI</span>
          <h1>Một khoảng nghỉ<br />chỉ dành cho bạn.</h1>
          <p>Đăng nhập để đặt lịch chăm sóc, theo dõi lịch hẹn và khám phá dịch vụ tại Seoul Center.</p>
          <div className="auth-intro-note">
            <i className="bi bi-heart" aria-hidden="true" />
            <span><strong>Chăm sóc từ sự lắng nghe</strong><small>Một trải nghiệm dành riêng cho bạn.</small></span>
          </div>
          <img src={spaPhoto} alt="Trải nghiệm chăm sóc da tại Seoul Center" />
        </section>
        <Card className="app-login-card">
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

          {location.state?.from?.startsWith("/slots") && <Alert variant="info">Vui lòng đăng nhập để xem lịch trống và đặt lịch hẹn.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          {successMsg && <Alert variant="success">{successMsg}</Alert>}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3 text-start" controlId="formBasicEmail">
              <Form.Label className="fw-bold">
                Email hoặc Số điện thoại*
              </Form.Label>
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
              variant="primary"
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
            style={{ fontSize: "1rem" }}
          >
            <Link className="auth-inline-link mb-2" to="/forgot-password">
              Quên mật khẩu?
            </Link>
            <span>
              Chưa có tài khoản?{" "}
              <Link className="auth-inline-link" to="/register">
                Đăng ký
              </Link>
            </span>
            <Link className="auth-inline-link mt-3" to="/dashboard/login">Đăng nhập dành cho nhân viên</Link>
          </div>
        </Card.Body>
      </Card>
      </div>
    </Container>
  );
};

export default Login;