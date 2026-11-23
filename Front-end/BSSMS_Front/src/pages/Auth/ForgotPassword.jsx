
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Card,
  InputGroup,
} from "react-bootstrap";
import axios from "axios";
import FloatingAlert from "../../components/FloatingAlert";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const staffPortal = new URLSearchParams(location.search).get("portal") === "staff";

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
      setError("Please enter a valid email.");
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await axios.post(
        "/api/forgot-password/check-email",
        {
          action: "send-code",
          email: inputEmail,
        },
        { withCredentials: true },
      );

      if (response.status === 200) {
        setIsEmailVerified(true);
        setCountdown(60);
        setSuccessMsg(
          "Valid email! Please enter the verification code sent to your email",
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not send the verification code. Please check again!",
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const inputEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(inputEmail)) {
      setError("Invalid email format.");
      return;
    }

    if (!isEmailVerified) {
      setError("Please click Send code first.");
      return;
    }

    try {
      const response = await axios.post(
        "/api/forgot-password/check-email",
        {
          action: "verify-code",
          email: inputEmail,
          code: verificationCode.trim(),
        },
        { withCredentials: true },
      );

      if (response.status === 200) {
        setSuccessMsg("Verification successful! Redirecting...");
        setTimeout(() => {
          navigate(staffPortal ? "/reset-password?portal=staff" : "/reset-password", { state: { email: inputEmail } });
        }, 1000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid verification code. Please check again.",
      );
    }
  };

  return (
    <Container
      className="app-login-surface d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "#fdf6f7" }}
    >
      <Card
        className="shadow-sm"
        style={{
          width: "450px",
          padding: "30px",
          borderRadius: "12px",
          border: "none",
        }}
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
              onClick={() => navigate(staffPortal ? "/dashboard/login" : "/login")}
              title="Back to login"
            ></i>
            <h4
              className="text-center fw-bold text-uppercase m-0"
              style={{ color: "#3a2a2f" }}
            >
              Forgot password
            </h4>
          </div>

          <FloatingAlert message={error} onClose={() => setError("")} />
          <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} />

          <Form onSubmit={handleConfirm}>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "1rem" }}>
                Email*
              </Form.Label>
              <InputGroup>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsEmailVerified(false);
                  }}
                  required
                />
                <Button
                  variant={countdown > 0 ? "secondary" : "danger"}
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0 || !email.trim()}
                  style={{ width: "110px", fontWeight: "bold" }}
                >
                  {isSendingCode
                    ? "Processing"
                    : countdown > 0
                      ? `${countdown}s`
                      : "Send code"}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "1rem" }}>
                Verification code*
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter the 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                required
                disabled={!isEmailVerified}
                style={{
                  backgroundColor: !isEmailVerified ? "#e9ecef" : "white",
                }}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                className="w-50 fw-bold"
                onClick={() => navigate(staffPortal ? "/dashboard/login" : "/login")}
              >
                Back
              </Button>
              <Button
                variant="danger"
                type="submit"
                className="w-50 fw-bold"
                style={{ backgroundColor: "#a61e4d", border: "none" }}
                disabled={!isEmailVerified || !verificationCode}
              >
                Confirm
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
