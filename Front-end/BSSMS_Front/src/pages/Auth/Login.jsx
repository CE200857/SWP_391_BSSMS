import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import spaPhoto from "../../assets/figma/login-spa-original.jpeg";

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
      setError(
        "Vui lòng nhập đúng định dạng Email hoặc Số điện thoại (10 chữ số, bắt đầu bằng số 0)."
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
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
          `Đăng nhập thành công! Chào mừng ${data.fullName} (${data.role})`
        );

        setTimeout(() => {
          // Kiểm tra xem người dùng có vừa chọn khung giờ trống trước khi đăng nhập không
          const pendingRaw = sessionStorage.getItem("bssms.pendingBooking");
          if (pendingRaw) {
            sessionStorage.removeItem("bssms.pendingBooking");
            const pendingSlot = JSON.parse(pendingRaw);

            if (data.role === "Customer") {
              navigate("/appointments/online", { state: pendingSlot });
              return;
            }

            if (data.role === "Receptionist" || data.role === "Manager") {
              sessionStorage.setItem(
                "bssms.walkInAppointmentDraft",
                JSON.stringify({
                  formData: {
                    customerId: "",
                    ...pendingSlot,
                    notes: "",
                  },
                  customerSearch: "",
                })
              );
              navigate("/appointments/create");
              return;
            }
          }

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
        }, 1200);
      } else {
        setError(data.message || "Đăng nhập thất bại!");
        setIsLoading(false);
      }
    } catch {
      setError("Lỗi kết nối đến máy chủ!");
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
            <Link className="auth-inline-link mb-2" to="/forgot-password">
              Quên mật khẩu?
            </Link>
            <span>
              Chưa có tài khoản?{" "}
              <Link className="auth-inline-link" to="/register">
                Đăng ký
              </Link>
            </span>
          </div>
        </Card.Body>
      </Card>
      </div>
    </Container>
  );
};

export default Login;