import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert, Badge, Modal, Spinner } from "react-bootstrap";
import axios from "axios";
import "./StaffAdmin.css";

const roleLabels = {
  Manager: "Quản lý",
  Receptionist: "Lễ tân",
  Technician: "Kỹ thuật viên",
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
    salary: "",
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
            salary: data.salary || "",
            username: data.username || "",
            status: data.status || "Active",
            password: "",
          });
        } else {
          setError("Không tìm thấy thông tin nhân viên này.");
        }
      } catch (fetchError) {
        console.error("Lỗi tải hồ sơ nhân viên:", fetchError);
        setError("Không thể tải hồ sơ nhân viên. Vui lòng kiểm tra kết nối và thử lại.");
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
      setError("Họ và tên bắt buộc phải có từ 2 từ trở lên!");
      return;
    }

    const phoneRegex = /^0[1-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ (Phải gồm 10 chữ số và bắt đầu bằng số 0)!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Email không đúng định dạng!");
      return;
    }

    if (formData.username.trim().length < 3 || formData.username.includes(" ")) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự và không chứa khoảng trắng!");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    const salaryValue = parseFloat(formData.salary);
    if (isNaN(salaryValue) || salaryValue < 0) {
      setError("Mức lương không hợp lệ (Phải là số lớn hơn hoặc bằng 0)!");
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
        setMessage("Lưu thông tin nhân viên thành công!");
        setTimeout(() => navigate("/staffs"), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Chỉnh sửa hồ sơ nhân viên</h2>
          <p>Cập nhật thông tin tài khoản và công việc của nhân sự.</p>
        </div>
      </div>

      {message && <Alert variant="success" role="status"><i className="bi bi-check-circle-fill me-2" aria-hidden="true"></i>{message}</Alert>}
      {error && <Alert variant="danger" role="alert"><i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>{error}</Alert>}

      {isFetching ? (
        <div className="d-flex justify-content-center py-5" role="status" aria-label="Đang tải hồ sơ nhân viên">
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
                    <h3 className="staff-profile-name">{formData.fullName || "Nhân viên"}</h3>
                    <p className="staff-profile-meta">
                      {roleLabels[formData.role] || formData.role || "Chưa cập nhật"}
                    </p>
                    <Badge className={`staff-status-badge${formData.status === "Active" ? "" : " is-inactive"}`}>
                      {formData.status === "Active" ? "Đang hoạt động" : "Không hoạt động"}
                    </Badge>
                    <div className="staff-profile-details">
                      <span>Mã nhân viên</span>
                      <strong>#{formData.staffId}</strong>
                      <span className="mt-3">Tên đăng nhập</span>
                      <strong>{formData.username || "Chưa cập nhật"}</strong>
                    </div>
                  </aside>
                </Col>

                <Col md={9}>
                  <h3 className="staff-form-section-title">
                    <i className="bi bi-person-lines-fill" aria-hidden="true"></i>
                    Thông tin cá nhân
                  </h3>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Họ và tên <span className="text-danger">*</span></Form.Label>
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
                        <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tên đăng nhập <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} autoComplete="username" required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h3 className="staff-form-section-title mt-3">
                    <i className="bi bi-briefcase" aria-hidden="true"></i>
                    Thông tin công việc
                  </h3>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Chức vụ <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="role" value={formData.role} onChange={handleChange} required>
                          <option value="Receptionist">Lễ tân (Receptionist)</option>
                          <option value="Technician">Kỹ thuật viên (Technician)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ngày vào làm</Form.Label>
                        <Form.Control type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mức lương (VNĐ) <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="number" name="salary" value={formData.salary} onChange={handleChange} required min="0" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu mới</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Để trống nếu không muốn đổi"
                          autoComplete="new-password"
                        />
                        <Form.Text>Để trống để giữ nguyên mật khẩu hiện tại.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="staff-form-footer">
                    <Button variant="outline-secondary" onClick={() => setShowCancelModal(true)}>
                      Hủy bỏ
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                      <i className="bi bi-check2 me-1" aria-hidden="true"></i>
                      {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
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
            <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Trở về danh sách
          </Button>
        </div>
      )}

      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Xác nhận hủy</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn hủy bỏ? Các thay đổi chưa lưu sẽ bị mất.</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>Không</Button>
          <Button variant="danger" onClick={() => navigate("/staffs")}>Có, quay lại</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold"><i className="bi bi-question-circle-fill me-2"></i>Xác nhận lưu</Modal.Title>
        </Modal.Header>
        <Modal.Body>Bạn có chắc chắn muốn lưu các thay đổi thông tin của nhân viên <span className="fw-bold">{formData.fullName}</span> không?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>Hủy</Button>
          <Button variant="primary" onClick={confirmSave}>Đồng ý lưu</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditStaffProfile;