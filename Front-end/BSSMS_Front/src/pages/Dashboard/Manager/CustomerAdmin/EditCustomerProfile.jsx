/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Form,
  Button,
  Row,
  Col,
  Badge,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import { today, birthDateError, MIN_BIRTH_DATE } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";

const EditCustomerProfile = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerId: "",
    accountId: "",
    fullName: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    address: "",
    status: "",
    username: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [membership, setMembership] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(
          `/api/customers?id=${id}`,
          {
            credentials: "include",
          },
        );
        if (response.ok) {
          const data = await response.json();
          setMembership(data.membership || null);
          setFormData({
            customerId: data.customerId || "",
            accountId: data.accountId || "",
            fullName: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            gender: data.gender
              ? data.gender.trim().charAt(0).toUpperCase() +
              data.gender.trim().slice(1).toLowerCase()
              : "",
            dob: data.dob ? data.dob.substring(0, 10) : "",
            address: data.address || "",
            status: data.status || "Active",
            username: data.username || "",
          });
        } else {
          setError("This customer’s information was not found.");
        }
      } catch (err) {
        setError("Cannot connect to the server.");
      }
    };
    fetchCustomerData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const nameWords = formData.fullName.trim().split(/\s+/);
    if (nameWords.length < 2) {
      setError("Please enter your full name (first and last name).");
      return;
    }

    const phoneRegex = /^0[1-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError(
        "Invalid phone number (must have 10 digits and start with 0)!",
      );
      return;
    }

    const dobProblem = birthDateError(formData.dob);
    if (dobProblem) {
      setError(dobProblem);
      return;
    }

    if (formData.email && formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError(
          "Invalid email format (example: nguyenvanA@gmail.com)!",
        );
        return;
      }
    }

    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    setShowSaveModal(false);
    setIsLoading(true);

    try {
      const response = await axios.post(
        "/api/customers",
        { ...formData, action: "update" },
        { withCredentials: true },
      );
      if (response.status === 200) {
        setMessage("Customer details saved.");
        setTimeout(() => navigate("/customers"), 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Update failed. Please try again!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="customer-profile-page">
      <div className="ui-page-heading">
        <div className="customer-profile-heading">
          <Button
            variant="outline-secondary"
            className="customer-profile-back"
            onClick={() => navigate("/customers")}
            aria-label="Back to customer list"
          >
            <i className="bi bi-arrow-left" aria-hidden="true" />
          </Button>
          <div>
            <h1>Edit customer profile</h1>
            <p>Update the customer’s account and profile information.</p>
          </div>
        </div>
      </div>

      <FloatingAlert message={message} variant="success" onClose={() => setMessage("")} />
      <FloatingAlert message={error} onClose={() => setError("")} />

      <Card className="customer-profile-card">
        <Card.Body>
          <Form className="customer-profile-form" onSubmit={handlePreSubmit}>
            <Row className="customer-profile-layout">
              <Col md={3} className="customer-profile-summary">
                <div
                  className="customer-profile-avatar"
                  aria-label={`Profile picture ${formData.fullName || "customers"}`}
                >
                  {formData.fullName
                    ? formData.fullName.charAt(0).toUpperCase()
                    : "C"}
                </div>
                <div className="mt-3">
                  <Badge
                    bg={formData.status === "Active" ? "success" : "danger"}
                    className="px-3 py-2 fs-6"
                  >
                    {formData.status === "Active"
                      ? "Active"
                      : "Inactive"}
                  </Badge>
                </div>
                <div className="customer-membership-summary">
                  <div className="customer-membership-title">
                    <i className="bi bi-award" aria-hidden="true" />
                    Membership tier
                  </div>

                  {membership ? (
                    <>
                      <Badge
                        bg="warning"
                        text="dark"
                        className="px-3 py-2 text-wrap"
                      >
                        {membership.tierName}
                      </Badge>

                      <div className="customer-membership-discount">
                        <i className="bi bi-percent" aria-hidden="true" />
                        Discount:{" "}
                        {Number(
                          membership.discountPercent ?? 0
                        ).toLocaleString("vi-VN")}%
                      </div>

                      <div className="customer-membership-spending">
                        <span>Required spending</span>
                        <strong>
                          {Number(
                            membership.minSpending ?? 0
                          ).toLocaleString("vi-VN")} ₫
                        </strong>
                      </div>

                      {membership.description && (
                        <div className="customer-membership-description">
                          {membership.description}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted small">
                      No membership tier information yet.
                    </div>
                  )}
                </div>
                <div className="customer-profile-id">
                  Customer ID: #{formData.customerId}
                </div>
              </Col>

              <Col md={9} className="customer-profile-fields">
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-secondary">
                        Username
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.username}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        The username cannot be changed.
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Full name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">
                        Phone number*
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Email</Form.Label>
                      <Form.Control
                        type="text"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Date of birth</Form.Label>
                      <Form.Control
                        type="date"
                        name="dob"
                        min={MIN_BIRTH_DATE}
                        max={today()}
                        value={formData.dob}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Gender</Form.Label>
                      <Form.Select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                      >
                        <option value="" disabled>
                          Select gender
                        </option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-danger">
                        System status
                      </Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={
                          user?.role !== "Manager" &&
                          user?.role !== "Receptionist"
                        }
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">
                          Inactive (Account locked)
                        </option>
                      </Form.Select>
                      {user?.role !== "Manager" &&
                        user?.role !== "Receptionist" && (
                          <Form.Text className="text-muted">
                            Only the Manager and Receptionist can change the status.
                          </Form.Text>
                        )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </Form.Group>

                <div className="customer-profile-actions">
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm cancellation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel? Unsaved changes will be lost.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            No
          </Button>
          <Button variant="danger" onClick={() => navigate("/customers")}>
            Yes, leave
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showSaveModal}
        onHide={() => setShowSaveModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold">
            <i className="bi bi-question-circle-fill me-2"></i>Save
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to save the changes to customer{" "}
          <span className="fw-bold">{formData.fullName}</span> ?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditCustomerProfile;
