import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Badge, Modal, Spinner } from "react-bootstrap";
import axios from "axios";
import "./StaffAdmin.css";
import FloatingAlert from "../../../../components/FloatingAlert";

const roleLabels = {
  Manager: "Manager",
  Receptionist: "Receptionist",
  Technician: "Technician",
};

const EditStaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    staffId: "",
    accountId: "",
    fullName: "",
    phone: "",
    email: "",
    role: "",
    hireDate: "",
    username: "",
    status: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [services, setServices] = useState([]);
  const [skillIds, setSkillIds] = useState([]);

  useEffect(() => {
    if (formData.role !== "Technician" || !formData.staffId) return;
    Promise.all([
      axios.get("/api/service", { withCredentials: true }),
      axios.get(`/api/staff?skillsOf=${formData.staffId}`, { withCredentials: true }),
    ]).then(([srv, skills]) => {
      setServices((srv.data || []).filter((s) => s.status === "Active"));
      setSkillIds((skills.data || []).map((s) => s.serviceId));
    }).catch(() => setServices([]));
  }, [formData.role, formData.staffId]);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const response = await fetch(`/api/staff?id=${id}`, {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setFormData({
            staffId: data.staffId || "",
            accountId: data.accountId || "",
            fullName: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            role: data.role || "",
            hireDate: data.hireDate ? data.hireDate.substring(0, 10) : "",
            username: data.username || "",
            status: data.status || "Active",
            password: "",
          });
        } else {
          setError("This staff member’s information was not found.");
        }
      } catch (fetchError) {
        console.error("Error loading staff profile:", fetchError);
        setError("Could not load the staff profile. Please check your connection and try again.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchStaffData();
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
      setError("Invalid phone number (must have 10 digits and start with 0)!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Invalid email format!");
      return;
    }

    if (formData.username.trim().length < 3 || formData.username.includes(" ")) {
      setError("The username must have at least 3 characters and no spaces!");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("The new password must have at least 6 characters!");
      return;
    }

    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    setShowSaveModal(false);
    setIsLoading(true);

    const formattedName = formData.fullName.trim().split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

    const payload = {
      ...formData,
      action: "update",
      fullName: formattedName
    };

    try {
      const response = await axios.post(
        "/api/staff",
        payload,
        { withCredentials: true }
      );

      if (response.status === 200) {
        if (formData.role === "Technician") {
          await axios.post("/api/staff", { action: "save-skills", staffId: formData.staffId, serviceIds: skillIds }, { withCredentials: true });
        }
        setMessage("Staff details saved.");
        setTimeout(() => navigate("/staffs"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Update failed. Please try again!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Edit staff profile</h2>
          <p>Update the staff member’s account and job information.</p>
        </div>
      </div>

      <FloatingAlert message={message} variant="success" onClose={() => setMessage("")} />
      <FloatingAlert message={error} onClose={() => setError("")} />

      {isFetching ? (
        <div className="d-flex justify-content-center py-5" role="status" aria-label="Loading staff profile">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : formData.staffId ? (
        <Card className="staff-form-card">
          <Card.Body className="staff-form-card-body">
            <Form onSubmit={handlePreSubmit}>
              <Row className="staff-profile-layout g-4">
                <Col md={3}>
                  <aside className="staff-profile-card">
                    <div className="staff-avatar" aria-hidden="true">
                      {formData.fullName ? formData.fullName.trim().charAt(0).toUpperCase() : "N"}
                    </div>
                    <h3 className="staff-profile-name">{formData.fullName || "Staff"}</h3>
                    <p className="staff-profile-meta">
                      {roleLabels[formData.role] || formData.role || "Not provided"}
                    </p>
                    <Badge className={`staff-status-badge${formData.status === "Active" ? "" : " is-inactive"}`}>
                      {formData.status === "Active" ? "Active" : "Inactive"}
                    </Badge>
                    <div className="staff-profile-details">
                      <span>Staff ID</span>
                      <strong>#{formData.staffId}</strong>
                      <span className="mt-3">Username</span>
                      <strong>{formData.username || "Not provided"}</strong>
                    </div>
                  </aside>
                </Col>

                <Col md={9}>
                  <h3 className="staff-form-section-title">
                    <i className="bi bi-person-lines-fill" aria-hidden="true"></i>
                    Personal information
                  </h3>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Full name <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} autoComplete="name" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone number <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Username <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} autoComplete="username" required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h3 className="staff-form-section-title mt-3">
                    <i className="bi bi-briefcase" aria-hidden="true"></i>
                    Job details
                  </h3>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Position <span className="text-danger">*</span></Form.Label>
                        <Form.Control value={roleLabels[formData.role] || formData.role} disabled />
                        <Form.Text>Change positions in the staff list (role assignment).</Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Start date</Form.Label>
                        <Form.Control type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    {formData.role === "Technician" && (
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Service skills</Form.Label>
                          <div className="d-flex flex-wrap gap-3 border rounded p-2">
                            {services.map((s) => (
                              <Form.Check key={s.serviceId} id={`edit-skill-${s.serviceId}`} label={s.serviceName}
                                checked={skillIds.includes(s.serviceId)}
                                onChange={() => setSkillIds((ids) => ids.includes(s.serviceId) ? ids.filter((x) => x !== s.serviceId) : [...ids, s.serviceId])} />
                            ))}
                          </div>
                        </Form.Group>
                      </Col>
                    )}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>New password</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Leave blank if you do not want to change it"
                          autoComplete="new-password"
                        />
                        <Form.Text>Leave blank to keep the current password.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="staff-form-footer">
                    <Button variant="outline-secondary" onClick={() => setShowCancelModal(true)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                      <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                      {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <div className="staff-form-card p-4">
          <Button variant="outline-secondary" onClick={() => navigate("/staffs")}>
            <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to list
          </Button>
        </div>
      )}

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm cancellation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to cancel? Unsaved changes will be lost.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>No</Button>
          <Button variant="danger" onClick={() => navigate("/staffs")}>Yes, leave</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold"><i className="bi bi-question-circle-fill me-2"></i>Save changes?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to save the changes to staff member <span className="fw-bold">{formData.fullName}</span> ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={confirmSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditStaffProfile;