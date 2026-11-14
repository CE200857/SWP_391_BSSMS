import { useEffect, useState } from "react";
import { today } from "../../../../services/api";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Modal } from "react-bootstrap";
import axios from "axios";
import { Row, Col } from "react-bootstrap";
import "./StaffAdmin.css";

const CreateStaff = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "Receptionist",
    hireDate: today(),
    serviceIds: [],
  });
  const [services, setServices] = useState([]);
  useEffect(() => {
    axios.get("/api/service", { withCredentials: true })
      .then((r) => setServices((r.data || []).filter((s) => s.status === "Active")))
      .catch(() => setServices([]));
  }, []);
  const toggleService = (id) => setFormData((f) => ({
    ...f,
    serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
  }));

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
      setError("Họ và tên bắt buộc phải có từ 2 từ trở lên!");
      return;
    }

    if (!/^0[1-9]\d{8}$/.test(formData.phone.trim())) {
      setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Email không đúng định dạng!");
      return;
    }

    if (formData.role === "Technician" && formData.serviceIds.length === 0) {
      setError("Kỹ thuật viên cần có ít nhất một kỹ năng dịch vụ!");
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
        "/api/staff",
        {
          action: "create",
          fullName: formattedName,
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          username: generatedUsername,
          password: "123456",
          hireDate: formData.hireDate || null,
          serviceIds: formData.role === "Technician" ? formData.serviceIds : [],
        },
        { withCredentials: true },
      );

      if (response.status === 201) {
        const finalUsername = response.data.username || generatedUsername;

        setAccountInfo({ username: finalUsername, password: "123456" });
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra, Username, SĐT hoặc Email có thể đã tồn tại!",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("/staffs");
  };

  return (
    <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Tạo tài khoản nhân sự</h2>
          <p>Điền thông tin để tạo hồ sơ và tài khoản đăng nhập cho nhân viên mới.</p>
        </div>
      </div>

      <Card className="staff-form-card">
        <Card.Header className="staff-form-card-header">
          <h3><i className="bi bi-person-plus me-2" aria-hidden="true"></i>Thông tin nhân sự</h3>
          <p>Các trường có dấu (*) là bắt buộc. Tài khoản ban đầu sẽ được tạo tự động.</p>
        </Card.Header>
        <Card.Body className="staff-form-card-body">
          {error && <Alert variant="danger" role="alert">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Thị Lan"
                    autoComplete="name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại 10 số"
                    autoComplete="tel"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chức vụ <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="Receptionist">Lễ tân (Receptionist)</option>
                    <option value="Technician">Kỹ thuật viên (Technician)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày vào làm</Form.Label>
                  <Form.Control
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              {formData.role === "Technician" && (
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kỹ năng dịch vụ <span className="text-danger">*</span></Form.Label>
                    <div className="d-flex flex-wrap gap-3 border rounded p-2">
                      {services.map((s) => (
                        <Form.Check
                          key={s.serviceId}
                          id={`skill-${s.serviceId}`}
                          label={s.serviceName}
                          checked={formData.serviceIds.includes(s.serviceId)}
                          onChange={() => toggleService(s.serviceId)}
                        />
                      ))}
                    </div>
                    <Form.Text>Kỹ thuật viên chỉ được giao những dịch vụ đã chọn ở đây.</Form.Text>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <div className="staff-form-footer">
              <Button variant="outline-secondary" onClick={() => navigate("/staffs")}>
                <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Quay lại
              </Button>
              <Button variant="primary" type="submit" disabled={isLoading}>
                <i className="bi bi-person-check me-1" aria-hidden="true"></i>
                {isLoading ? "Đang tạo..." : "Xác nhận tạo"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Modal
        show={showSuccessModal}
        onHide={handleCloseSuccess}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title className="text-success fw-bold">
            <i className="bi bi-check-circle-fill me-2"></i> Tạo tài khoản thành
            công
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Tài khoản cho nhân sự mới đã được tạo trên hệ thống.</p>
          <div className="bg-light p-3 rounded border">
            <p className="mb-2">
              <strong>Tài khoản:</strong>{" "}
              <span className="text-primary fs-5">{accountInfo.username}</span>
            </p>
            <p className="mb-0">
              <strong>Mật khẩu mặc định:</strong>{" "}
              <span className="text-danger fs-5">{accountInfo.password}</span>
            </p>
          </div>
          <p className="mt-3 mb-0 text-muted small">
            <i className="bi bi-info-circle me-1"></i> Nhân viên có thể sử dụng
            thông tin này để đăng nhập và nên thay đổi mật khẩu sau đó.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseSuccess}>
            Đóng & Trở về danh sách
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CreateStaff;
