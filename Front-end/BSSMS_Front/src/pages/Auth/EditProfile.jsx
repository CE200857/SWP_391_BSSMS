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
      setErrorMsg("Email mới không đúng định dạng!");
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
        setSuccessMsg("Mã xác thực đã được gửi đến Email mới của bạn!");
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Không thể gửi mã xác thực. Vui lòng thử lại!"
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const validateForm = () => {
    if (formData.username.length < 3 || /\s/.test(formData.username)) {
      return "Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!";
    }

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      return "Các trường có dấu (*) là bắt buộc và không được bỏ trống!";
    }

    if (formData.fullName.trim().split(/\s+/).length < 2) {
      return "Họ và tên bắt buộc phải có từ 2 từ trở lên!";
    }

    if (!/^0[1-9]\d{8}$/.test(formData.phone.trim())) {
      return "Số điện thoại không hợp lệ (Gồm 10 số, bắt đầu bằng 0, số thứ 2 khác 0)!";
    }

    if (isCustomer) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        return "Email không đúng định dạng!";
      }

      if (isEmailChanged) {
        if (!isCodeSent) {
          return "Bạn đã thay đổi Email, vui lòng bấm 'Gửi mã' để nhận mã xác thực!";
        }
        if (verificationCode.trim().length !== 6) {
          return "Vui lòng nhập đủ 6 chữ số mã xác thực cho Email mới!";
        }
      }

      if (!formData.dob || !formData.address.trim()) {
        return "Vui lòng nhập đầy đủ Ngày sinh và Địa chỉ!";
      }
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
        err.response?.data?.message || "Đã xảy ra lỗi khi cập nhật hồ sơ!"
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
            Chỉnh sửa hồ sơ
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
                    Tên đăng nhập (*)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Nhập tên đăng nhập mới"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="text-muted fw-bold mb-1">
                    Họ và Tên (*)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên mới"
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
                          placeholder="Nhập địa chỉ email"
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
                            ? "Đang gửi"
                            : countdown > 0
                              ? `${countdown}s`
                              : "Gửi mã"}
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted fw-bold mb-1">
                        Mã xác thực Email mới
                      </Form.Label>
                      <Form.Control
                        type="text"
                        placeholder={
                          isEmailChanged
                            ? "Nhập mã 6 chữ số được gửi về email mới"
                            : "Chỉ cần nhập mã khi bạn thay đổi Email"
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
                    Số điện thoại (*)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                  />
                </Form.Group>

                {isCustomer && (
                  <>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="text-muted fw-bold mb-1">
                            Ngày sinh (*)
                          </Form.Label>
                          <Form.Control
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label className="text-muted fw-bold mb-1">
                            Giới tính (*)
                          </Form.Label>
                          <Form.Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option value="Male">Nam</option>
                            <option value="Female">Nữ</option>
                            <option value="Other">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-muted fw-bold mb-1">
                        Địa chỉ (*)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Nhập địa chỉ của bạn"
                      />
                    </Form.Group>
                  </>
                )}

                <Form.Group className="mb-4">
                  <Form.Label className="text-muted fw-bold mb-1">
                    Trạng thái tài khoản (Chỉ xem)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      formData.status === "Active"
                        ? "Đang hoạt động"
                        : "Không hoạt động"
                    }
                    disabled
                    className="bg-light fw-bold text-success"
                  />
                </Form.Group>

                <div className="d-flex justify-content-end mt-auto pt-3 gap-2">
                  <Button variant="primary" type="submit">
                    Lưu cập nhật
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Hủy bỏ
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
            Xác nhận cập nhật
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn lưu các thay đổi thông tin hồ sơ này không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Hủy (Quay lại)
          </Button>
          <Button variant="primary" onClick={handleConfirmUpdate}>
            Xác nhận
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
            Xác nhận hủy
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Những thay đổi của bạn sẽ không được lưu lại. Bạn có chắc chắn muốn
          quay về trang hồ sơ không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Tiếp tục cập nhật (Hủy)
          </Button>
          <Button variant="danger" onClick={() => navigate("/profile")}>
            Xác nhận hủy
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditProfile;