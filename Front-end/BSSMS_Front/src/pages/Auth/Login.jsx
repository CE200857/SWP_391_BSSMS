import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import spaPhoto from "../../assets/figma/login-spa-original.jpeg";

import { loginAccount, loginDestination, roleHome } from "../../auth/login";
import FloatingAlert from "../../components/FloatingAlert";

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
        "Please enter a valid email or phone number (10 digits, starting with 0)."
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
      setError(err.message || 'Cannot connect to the server.');
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
          <span className="home-eyebrow">WELCOME BACK</span>
          <h1>A pause<br />just for you.</h1>
          <p>Log in to book treatments, manage your appointments and explore services at Seoul Center.</p>
          <div className="auth-intro-note">
            <i className="bi bi-heart" aria-hidden="true" />
            <span><strong>Care that starts with listening</strong><small>An experience just for you.</small></span>
          </div>
          <img src={spaPhoto} alt="Skin care experience at Seoul Center" />
        </section>
        <Card className="app-login-card">
        <Card.Body>
          <div className="position-relative mb-4">
            <button
              type="button"
              className="position-absolute btn btn-link p-0 d-inline-flex align-items-center justify-content-center"
              style={{
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 44,
                height: 44,
                fontSize: "1.5rem",
                color: "#6c757d",
              }}
              onClick={() => navigate("/bssms-guest")}
              aria-label="Back to home page"
              title="Back to home page"
            >
              <i className="bi bi-arrow-left" aria-hidden="true" />
            </button>

            <h2 className="text-center fw-bold text-uppercase m-0">
              Log in
            </h2>
          </div>

          {location.state?.from?.startsWith("/slots") && <Alert variant="info">Please log in to see available times and book an appointment.</Alert>}
          <FloatingAlert message={error} onClose={() => setError("")} />
          <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} />

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3 text-start" controlId="formBasicEmail">
              <Form.Label className="fw-bold">
                Email or phone number*
              </Form.Label>
              <Form.Control
                type="text"
                autoComplete="username"
                placeholder="Please enter your email or phone number"
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
              <Form.Label className="fw-bold">Password*</Form.Label>
              <Form.Control
                type="password"
                autoComplete="current-password"
                placeholder="Please enter your password"
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
                ? "Processing..."
                : successMsg
                ? "Redirecting..."
                : "Log in"}
            </Button>
          </Form>

          <div
            className="d-flex flex-column text-start"
            style={{ fontSize: "1rem" }}
          >
            <Link className="auth-inline-link mb-2" to="/forgot-password">
              Forgot password?
            </Link>
            <span>
              Don’t have an account?{" "}
              <Link className="auth-inline-link" to="/register">
                Sign up
              </Link>
            </span>
            <Link className="auth-inline-link mt-3" to="/dashboard/login">Staff login</Link>
          </div>
        </Card.Body>
      </Card>
      </div>
    </Container>
  );
};

export default Login;