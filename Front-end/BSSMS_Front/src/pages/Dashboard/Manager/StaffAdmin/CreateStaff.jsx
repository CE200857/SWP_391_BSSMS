import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Modal } from "react-bootstrap";
import axios from "axios";

const CreateStaff = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "Receptionist",
    salary: "",
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

    const salaryValue = parseFloat(formData.salary);
    if (isNaN(salaryValue) || salaryValue < 0) {
      setError("Mức lương không hợp lệ (Phải là số lớn hơn hoặc bằng 0)!");
      setIsLoading(false);
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
          salary: salaryValue,
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
    <Container fluid className="mt-4 px-4 d-flex justify-content-center">
      <Card
        className="shadow-sm border-0 w-50"
        style={{ borderRadius: "15px" }}
      >
        <Card.Body className="p-5">
          <h3 className="mb-4 fw-bold text-center text-uppercase">
            Tạo tài khoản nhân sự
          </h3>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Họ và tên (*)</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Nhập họ và tên nhân viên"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email (*)</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Nhập địa chỉ email hợp lệ"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Số điện thoại (*)</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Nhập số điện thoại 10 số"
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Chức vụ (*)</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="Receptionist">Lễ tân (Receptionist)</option>
                <option value="Technician">Kỹ thuật viên (Technician)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">Mức lương (VNĐ) (*)</Form.Label>
              <Form.Control
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="Nhập mức lương"
                required
                min="0"
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => navigate("/staffs")}>
                Quay lại
              </Button>
              <Button variant="danger" type="submit" disabled={isLoading}>
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
