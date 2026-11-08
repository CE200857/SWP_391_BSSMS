import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Modal } from "react-bootstrap";
import axios from "axios";

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
      setError("Họ và tên bắt buộc phải có từ 2 từ trở lên!");
      return;
    }

    if (!/^0[1-9]\d{8}$/.test(formData.phone.trim())) {
      setError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)!");
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
          "Có lỗi xảy ra, SĐT có thể đã tồn tại!",
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
          <h1>Tạo tài khoản khách hàng</h1>
          <p>Tạo hồ sơ khách hàng để sử dụng các dịch vụ tại Seoul Center.</p>
        </div>
      </div>
      <Card className="customer-create-card">
        <Card.Header className="customer-create-card-heading">
          <i className="bi bi-person-plus" aria-hidden="true" />
          <div>
            <strong>Thông tin khách hàng</strong>
            <span>Các trường có dấu (*) là bắt buộc.</span>
          </div>
        </Card.Header>
        <Card.Body>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form className="customer-create-form" onSubmit={handleSubmit}>
            <div className="customer-create-fields">
              <Form.Group>
                <Form.Label className="fw-bold">Họ và tên (*)</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Nhập họ và tên khách hàng"
                  required
                />
              </Form.Group>

              <Form.Group>
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

              <Form.Group>
                <Form.Label className="fw-bold">Giới tính (*)</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Female">Nữ</option>
                  <option value="Male">Nam</option>
                  <option value="Other">Khác</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="customer-create-actions">
              <Button variant="outline-secondary" onClick={() => navigate("/customers")}>Hủy</Button>
              <Button variant="primary" type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Xác nhận tạo"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Modal className="customer-create-success" show={showSuccessModal} onHide={handleCloseSuccess} centered backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title className="text-success fw-bold">
            <i className="bi bi-check-circle-fill me-2"></i> Tạo hồ sơ thành công
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Tài khoản khách hàng đã được tạo thành công.</p>
          <div className="customer-created-credentials">
            <p className="mb-2"><strong>Tài khoản:</strong> <span className="text-primary fs-5">{accountInfo.username}</span></p>
            <p className="mb-0"><strong>Mật khẩu mặc định:</strong> <span className="text-danger fs-5">{accountInfo.password}</span></p>
          </div>
          <p className="mt-3 mb-0 text-muted small">
            <i className="bi bi-info-circle me-1"></i> SĐT hoặc Tài khoản trên có thể dùng để định danh hoặc cho khách tự đăng nhập nếu muốn.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseSuccess}>
            Đóng & Quay lại danh sách
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CreateWalkInCustomer;
