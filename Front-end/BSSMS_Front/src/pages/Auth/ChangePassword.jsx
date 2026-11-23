import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button } from "react-bootstrap";
import FloatingAlert from "../../components/FloatingAlert";

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

    if (newPassword.length < 6) {
      setError("The new password must have at least 6 characters!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("The new password must be different from the current password!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || "Your password has been changed.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        setTimeout(() => {
          navigate("/profile");
        }, 2000);
      } else {
        setError(data.message || "Failed to change the password!");
      }
    } catch {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
      <Card className="shadow-sm border-0" style={{ width: "450px", borderRadius: "12px", padding: "30px" }}>
        <h3 className="text-center mb-4 fw-bold text-uppercase" style={{ color: "#3a2a2f" }}>
          Change password
        </h3>

        <FloatingAlert message={error} onClose={() => setError("")} />
        <FloatingAlert message={successMsg} variant="success" onClose={() => setSuccessMsg("")} />

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "1rem" }}>Current password*</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter the current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={isLoading || successMsg !== ""}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "1rem" }}>New password*</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading || successMsg !== ""}
            />
          </Form.Group>

          <Form.Group className="mb-4">
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

          <div className="d-flex gap-3">
            <Button
              variant="outline-secondary"
              className="fw-bold w-50"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              <i className="bi bi-arrow-left me-1"></i> Back
            </Button>

            <Button
              type="submit"
              className="fw-bold w-50 text-white"
              style={{ backgroundColor: "#a61e4d", border: "none" }}
              disabled={isLoading || successMsg !== ""}
            >
              {isLoading ? "Processing..." : "Confirm change"}
            </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
};

export default ChangePassword;