import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Row,
  Col,
  Button,
  Form,
  Modal,
  InputGroup,
} from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { PROVINCES, joinAddress, splitAddress } from "../../utils/provinces";
import { today, birthDateError, MIN_BIRTH_DATE } from "../../services/api";

const formatDobForInput = (dobString) => {
  if (!dobString) return "";
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return dobString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const EditProfile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialData = location.state?.profileData || null;
  const originalEmail = initialData?.email || "";

  const [formData, setFormData] = useState({
    username: initialData?.username || "",
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    dob: formatDobForInput(initialData?.dob) || "",
    gender: initialData?.gender || "Male",
    address: initialData?.address || "",
    role: initialData?.role || user?.role || "",
    status: initialData?.status || "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isCustomer = formData.role === "Customer";
  const isEmailChanged =
    isCustomer &&
    formData.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

  useEffect(() => {
    if (!initialData) {
      navigate("/profile");
    }
  }, [initialData, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrorMsg("");
    setSuccessMsg("");

    if (name === "email") {
      setIsCodeSent(false);
      setVerificationCode("");
    }
  };

  const handleSendEmailCode = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg("Invalid new email format!");
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await axios.post(
        "/api/update-profile",
        {
          action: "send-email-code",
          email: trimmedEmail,
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        setIsCodeSent(true);
        setCountdown(60);
        setSuccessMsg("A verification code has been sent to your new email!");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Could not send the verification code. Please try again!"
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const validateForm = () => {
    if (formData.username.length < 3 || /\s/.test(formData.username)) {
      return "The username must have at least 3 characters and no spaces!";
    }

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      return "Please fill in all required fields (*).";
    }

    if (formData.fullName.trim().split(/\s+/).length < 2) {
      return "Please enter your full name (first and last name).";
    }

    if (!/^0[1-9]\d{8}$/.test(formData.phone.trim())) {
      return "Invalid phone number (10 digits, starting with 0, second digit not 0)!";
    }

    if (isCustomer) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        return "Invalid email format!";
      }

      if (isEmailChanged) {
        if (!isCodeSent) {
          return "You have changed your email, please click 'Send code' to receive a verification code!";
        }
        if (verificationCode.trim().length !== 6) {
          return "Please enter all 6 digits of the verification code for the new email!";
        }
      }

      if (!formData.dob || !splitAddress(formData.address).province) {
        return "Please enter your date of birth and select a province/city!";
      }
      const dobProblem = birthDateError(formData.dob);
      if (dobProblem) return dobProblem;
    }

    return null;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const error = validateForm();
    if (error) {
      setErrorMsg(error);
    } else {
      setShowUpdateModal(true);
    }
  };

  const handleConfirmUpdate = async () => {
    setShowUpdateModal(false);

    try {
      const response = await axios.post(
        "/api/update-profile",
        {
          ...formData,
          email: formData.email.trim(),
          verificationCode: isEmailChanged ? verificationCode.trim() : "",
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const updatedUser = response.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        navigate("/profile");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "An error occurred while updating the profile!"
      );
    }
  };

  if (!initialData) return null;
  const initial = formData.fullName.charAt(0).toUpperCase() || "U";

  return (
    <Container fluid className="mt-4 px-4">
      <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-5">
          <h2 className="mb-5 fw-bold text-uppercase text-center">
            Edit profile
          </h2>

          {errorMsg && (
            <div
              className="alert alert-danger text-center fw-bold"
              role="alert"
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              className="alert alert-success text-center fw-bold"
              role="alert"
            >
              {successMsg}
            </div>
          )}

          <Form onSubmit={handlePreSubmit}>
            <Row>
              <Col
                md={4}
                className="d-flex flex-column align-items-center justify-content-center border-end mb-4 mb-md-0"
              >
                <div
                  className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center mb-3 shadow"
                  style={{
                    width: "160px",
                    height: "160px",
                    fontSize: "60px",
                    fontWeight: "bold",
                  }}
                >
                  {initial}
                </div>
                <span className="badge bg-success px-3 py-2 mt-1">
                  {formData.role}
                </span>
              </Col>

              <Col md={8} className="ps-md-5 d-flex flex-column">
                <Form.Group className="mb-3">
                  <Form.Label className="text-muted fw-bold mb-1">
                    Username (*)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter a new username"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted fw-bold mb-1">
                    Full name (*)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter a new full name"
                  />
                </Form.Group>

                {isCustomer ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted fw-bold mb-1">
                        Email (*)
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter email address"
                        />
                        <Button
                          variant={
                            !isEmailChanged || countdown > 0
                              ? "secondary"
                              : "danger"
                          }
                          onClick={handleSendEmailCode}
                          disabled={
                            !isEmailChanged || isSendingCode || countdown > 0
                          }
                          style={{ width: "110px", fontWeight: "bold" }}
                        >
                          {isSendingCode
                            ? "Sending"
                            : countdown > 0
                              ? `${countdown}s`
                              : "Send code"}
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted fw-bold mb-1">
                        New email verification code
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={
                          isEmailChanged
                            ? "Enter the 6-digit code sent to your new email"
                            : "Enter the code only when you change your email"
                        }
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        maxLength={6}
                        disabled={!isEmailChanged || !isCodeSent}
                        className={
                          !isEmailChanged || !isCodeSent ? "bg-light" : ""
                        }
                      />
                    </Form.Group>
                  </>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted fw-bold mb-1">
                      Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted fw-bold mb-1">
                    Phone number (*)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>

                {isCustomer && (
                  <>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="text-muted fw-bold mb-1">
                            Date of birth (*)
                          </Form.Label>
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
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="text-muted fw-bold mb-1">
                            Gender (*)
                          </Form.Label>
                          <Form.Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    {(() => {
                      const { detail, province } = splitAddress(formData.address);
                      const setAddress = (d, p) => setFormData((f) => ({ ...f, address: joinAddress(d, p) }));
                      return (
                        <Row>
                          <Col md={5} className="mb-3">
                            <Form.Label className="text-muted fw-bold mb-1">Province/City (*)</Form.Label>
                            <Form.Select value={province} onChange={(e) => setAddress(detail, e.target.value)}>
                              <option value="">Select province/city</option>
                              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </Form.Select>
                          </Col>
                          <Col md={7} className="mb-3">
                            <Form.Label className="text-muted fw-bold mb-1">Detailed address</Form.Label>
                            <Form.Control type="text" value={detail} maxLength={200}
                              onChange={(e) => setAddress(e.target.value, province)} placeholder="House number, street, ward/commune" />
                          </Col>
                        </Row>
                      );
                    })()}
                  </>
                )}

                <Form.Group className="mb-4">
                  <Form.Label className="text-muted fw-bold mb-1">
                    Account status (view only)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      formData.status === "Active"
                        ? "Active"
                        : "Inactive"
                    }
                    disabled
                    className="bg-light fw-bold text-success"
                  />
                </Form.Group>

                <div className="d-flex justify-content-end mt-auto pt-3 gap-2">
                  <Button variant="primary" type="submit">
                    Save changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <Modal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">
            Update
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to save the changes to this profile?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirmUpdate}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-danger">
            Confirm cancellation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Your changes will not be saved. Are you sure you want to
          go back to the profile page?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={() => navigate("/profile")}>
            Confirm cancellation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditProfile;