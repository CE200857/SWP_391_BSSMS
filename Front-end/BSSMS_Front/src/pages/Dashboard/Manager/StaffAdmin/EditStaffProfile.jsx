/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert, Badge, Modal } from "react-bootstrap";
import axios from "axios";

const EditStaffProfile = ({ user }) => {
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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/BSSMS-back/api/staff?id=${id}`, {
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
      } catch (err) {
        setError("Lỗi kết nối máy chủ!");
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
        "http://localhost:8080/BSSMS-back/api/staff",
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
    <Container className="mt-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" className="text-decoration-none text-secondary p-0 me-3" onClick={() => navigate("/staffs")}>
          <i className="bi bi-arrow-left fs-4"></i>
        </Button>
        <h2 className="fw-bold text-uppercase m-0">Chỉnh sửa hồ sơ nhân viên</h2>
      </div>

      {message && <Alert variant="success"><i className="bi bi-check-circle-fill me-2"></i>{message}</Alert>}
      {error && <Alert variant="danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>}

      <Card className="shadow-sm border-0 rounded-3">
        <Card.Body className="p-4">
          <Form onSubmit={handlePreSubmit}>
            <Row className="mb-4">
              <Col md={3} className="text-center mb-3 mb-md-0">
                <div 
                  className="rounded bg-secondary d-flex align-items-center justify-content-center mx-auto text-white" 
                  style={{ width: "150px", height: "150px", fontSize: "3rem" }}
                >
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="mt-3">
                  <Badge bg={formData.status === "Active" ? "success" : "danger"} className="px-3 py-2 fs-6">
                    {formData.status === "Active" ? "Đang hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
                <div className="mt-2 text-muted small">ID Nhân viên: #{formData.staffId}</div>
              </Col>

              <Col md={9}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Họ và Tên*</Form.Label>
                      <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Tên đăng nhập (Username)*</Form.Label>
                      <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Email*</Form.Label>
                      <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Số điện thoại*</Form.Label>
                      <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} required />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Ngày vào làm</Form.Label>
                      <Form.Control type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Mức lương (VNĐ)*</Form.Label>
                      <Form.Control type="number" name="salary" value={formData.salary} onChange={handleChange} required min="0" />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-danger">Đổi mật khẩu mới</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder="Để trống nếu không muốn đổi" 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Chức vụ (Role)*</Form.Label>
                      <Form.Select name="role" value={formData.role} onChange={handleChange} required>
                        <option value="Receptionist">Lễ tân (Receptionist)</option>
                        <option value="Technician">Kỹ thuật viên (Technician)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button variant="outline-secondary" onClick={() => setShowCancelModal(true)}>
                    Hủy bỏ
                  </Button>
                  <Button variant="danger" type="submit" disabled={isLoading} style={{ backgroundColor: "#a61e4d", border: "none" }}>
                    {isLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

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