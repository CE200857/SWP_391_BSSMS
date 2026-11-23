import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Modal } from "react-bootstrap";
import axios from "axios";
import FloatingAlert from "../../../components/FloatingAlert";

const CreateWalkInCustomer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "Female",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const generateUsername = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/\s+/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = formData.fullName.trim();
    if (trimmedName.split(/\s+/).length < 2) {
      setError("Please enter your full name (first and last name).");
      return;
    }

    if (!/^0[1-9]\d{8}$/.test(formData.phone.trim())) {
      setError("Invalid phone number (10 digits, starting with 0)!");
      return;
    }

    const generatedUsername = generateUsername(trimmedName);

    const formattedName = trimmedName
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    setIsLoading(true);
    try {
      const response = await axios.post(
        "/api/customers",
        {
          fullName: formattedName,
          phone: formData.phone.trim(),
          gender: formData.gender,
          username: generatedUsername,
          password: "123456"
        },
        { withCredentials: true }
      );

      if (response.status === 201) {
        setAccountInfo({ username: generatedUsername, password: "123456" });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "An error occurred, the phone number may already exist!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("/customers");
  };

  return (
    <Container fluid className="customer-create-page">
      <div className="ui-page-heading">
        <div>
          <h1>Create customer account</h1>
          <p>Create a customer profile to use services at Seoul Center.</p>
        </div>
      </div>
      <Card className="customer-create-card">
        <Card.Header className="customer-create-card-heading">
          <i className="bi bi-person-plus" aria-hidden="true" />
          <div>
            <strong>Customer information</strong>
            <span>Fields marked (*) are required.</span>
          </div>
        </Card.Header>
        <Card.Body>

          <FloatingAlert message={error} onClose={() => setError("")} />

          <Form className="customer-create-form" onSubmit={handleSubmit}>
            <div className="customer-create-fields">
              <Form.Group>
                <Form.Label className="fw-bold">Full name (*)</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter the customer’s full name"
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold">Phone number (*)</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter a 10-digit phone number"
                  required
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="fw-bold">Gender (*)</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="customer-create-actions">
              <Button variant="outline-secondary" onClick={() => navigate("/customers")}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Modal className="customer-create-success" show={showSuccessModal} onHide={handleCloseSuccess} centered backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title className="text-success fw-bold">
            <i className="bi bi-check-circle-fill me-2"></i> Profile created successfully
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>The customer account has been created successfully.</p>
          <div className="customer-created-credentials">
            <p className="mb-2"><strong>Account:</strong> <span className="text-primary fs-5">{accountInfo.username}</span></p>
            <p className="mb-0"><strong>Default password:</strong> <span className="text-danger fs-5">{accountInfo.password}</span></p>
          </div>
          <p className="mt-3 mb-0 text-muted small">
            <i className="bi bi-info-circle me-1"></i> The phone number or account above can be used for identification or for the customer to log in if they want.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseSuccess}>
            Close & Back to list
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CreateWalkInCustomer;
