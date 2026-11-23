/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Form, Button, Card } from "react-bootstrap";
import FloatingAlert from "../../components/FloatingAlert";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const staffPortal = new URLSearchParams(location.search).get("portal") === "staff";

  const email = location.state?.email || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate(staffPortal ? "/forgot-password?portal=staff" : "/forgot-password");
    }
  }, [email, navigate, staffPortal]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (newPassword.length < 6) {
      setError("The new password must have at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
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
        setSuccessMsg("Password reset! Redirecting to login...");
        setTimeout(() => {
          navigate(staffPortal ? "/dashboard/login" : "/login");
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.message || "An error occurred while resetting the password.");
      }
    } catch (err) {
      setError("Cannot connect to the server. Please check your connection.");
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
              Create a new password
            </h4>
          </div>

          <p className="text-muted text-center mb-4" style={{ fontSize: "1rem" }}>
            Please enter a new password for account: <br/> 
            <strong className="text-danger">{email}</strong>
          </p>

          <FloatingAlert message={error} onClose={() => setError("")} />
          <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} />

          <Form onSubmit={handleResetPassword}>
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "1rem" }}>New password*</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading || successMsg !== ""}
              />
            </Form.Group>

            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-bold" style={{ fontSize: "1rem" }}>Confirm new password*</Form.Label>
              <Form.Control
                type="password"
                placeholder="Re-enter the new password"
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
                onClick={() => navigate(staffPortal ? "/forgot-password?portal=staff" : "/forgot-password")}
                disabled={isLoading || successMsg !== ""}
              >
                Back
              </Button>
              <Button
                variant="danger"
                type="submit"
                className="w-50 fw-bold"
                style={{ backgroundColor: "#a61e4d", border: "none" }}
                disabled={isLoading || successMsg !== ""}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;