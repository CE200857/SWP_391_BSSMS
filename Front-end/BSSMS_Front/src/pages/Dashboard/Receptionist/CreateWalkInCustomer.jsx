import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, Modal } from "react-bootstrap";
import axios from "axios";

const CreateWalkInCustomer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "Female",
  });
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const generateUsername = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
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

    const generatedUsername = generateUsername(trimmedName);
    
    const formattedName = trimmedName.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/BSSMS-back/api/customers",
        {
          ...formData,
          fullName: formattedName,
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
      setError(err.response?.data?.message || "Có lỗi xảy ra, email hoặc SĐT có thể đã tồn tại!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate("/customers");
  };

  return (
    <Container fluid className="mt-4 px-4 d-flex justify-content-center">
      <Card className="shadow-sm border-0 w-50" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-5">
          <h3 className="mb-4 fw-bold text-center text-uppercase">Tạo khách vãng lai</h3>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Họ và tên (*)</Form.Label>
              <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Email (*)</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Số điện thoại (*)</Form.Label>
              <Form.Control type="text" name="phone" value={formData.phone} onChange={handleChange} required />
            </Form.Group>

            <div className="d-flex gap-3 mb-4">
              <Form.Group className="flex-grow-1">
                <Form.Label className="fw-bold">Ngày sinh (*)</Form.Label>
                <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} required />
              </Form.Group>

              <Form.Group style={{ width: "150px" }}>
                <Form.Label className="fw-bold">Giới tính (*)</Form.Label>
                <Form.Select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Female">Nữ</option>
                  <option value="Male">Nam</option>
                  <option value="Other">Khác</option>
                </Form.Select>
              </Form.Group>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button variant="secondary" onClick={() => navigate("/customers")}>Quay lại</Button>
              <Button variant="danger" type="submit" disabled={isLoading}>
                {isLoading ? "Đang tạo..." : "Xác nhận tạo"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={showSuccessModal} onHide={handleCloseSuccess} centered backdrop="static" keyboard={false}>
        <Modal.Header>
          <Modal.Title className="text-success fw-bold">
            <i className="bi bi-check-circle-fill me-2"></i> Tạo tài khoản thành công
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Tài khoản khách hàng đã được khởi tạo trên hệ thống.</p>
          <div className="bg-light p-3 rounded border">
            <p className="mb-2"><strong>Tài khoản:</strong> <span className="text-primary fs-5">{accountInfo.username}</span></p>
            <p className="mb-0"><strong>Mật khẩu mặc định:</strong> <span className="text-danger fs-5">{accountInfo.password}</span></p>
          </div>
          <p className="mt-3 mb-0 text-muted small"><i className="bi bi-info-circle me-1"></i> Vui lòng cung cấp thông tin này cho khách hàng để họ có thể đăng nhập.</p>
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