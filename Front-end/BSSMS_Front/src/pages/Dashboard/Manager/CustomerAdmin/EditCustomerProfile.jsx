/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Row, Col, Alert, Badge, Modal } from "react-bootstrap";
import axios from "axios";

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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/BSSMS-back/api/customers?id=${id}`, {
          credentials: "include"
        });
        if (response.ok) {
          const data = await response.json();
          setFormData({
            customerId: data.customerId || "",
            accountId: data.accountId || "",
            fullName: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            gender: data.gender ? data.gender.trim().charAt(0).toUpperCase() + data.gender.trim().slice(1).toLowerCase() : "",
            dob: data.dob ? data.dob.substring(0, 10) : "",
            address: data.address || "",
            status: data.status || "Active",
            username: data.username || "", 
          });
        } else {
          setError("Không tìm thấy thông tin khách hàng này.");
        }
      } catch (err) {
        setError("Lỗi kết nối máy chủ!");
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
      setError("Họ và tên bắt buộc phải có từ 2 từ trở lên!");
      return;
    }

    const phoneRegex = /^0[1-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError("Số điện thoại không hợp lệ (Phải gồm 10 chữ số và bắt đầu bằng số 0)!");
      return;
    }

    if (formData.email && formData.email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Email không đúng định dạng (Ví dụ chuẩn: nguyenvanA@gmail.com)!");
        return;
      }
    }

    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    setShowSaveModal(false); // Đóng modal
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/BSSMS-back/api/customers?action=update",
        formData,
        { withCredentials: true }
      );

      if (response.status === 200) {
        setMessage("Lưu thông tin khách hàng thành công!");
        setTimeout(() => navigate("/customers"), 2000);
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
        <Button variant="link" className="text-decoration-none text-secondary p-0 me-3" onClick={() => navigate("/customers")}>
          <i className="bi bi-arrow-left fs-4"></i>
        </Button>
        <h2 className="fw-bold text-uppercase m-0">Chỉnh sửa hồ sơ khách hàng</h2>
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
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : "C"}
                </div>
                <div className="mt-3">
                  <Badge bg={formData.status === "Active" ? "success" : "danger"} className="px-3 py-2 fs-6">
                    {formData.status === "Active" ? "Đang hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>
                <div className="mt-2 text-muted small">ID Khách hàng: #{formData.customerId}</div>
              </Col>

              <Col md={9}>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-secondary">Tên đăng nhập (Username)</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={formData.username} 
                        disabled 
                        style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }} 
                      />
                      <Form.Text className="text-muted">Tên đăng nhập không thể thay đổi.</Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Họ và Tên*</Form.Label>
                      <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
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
                      <Form.Label className="fw-bold">Email</Form.Label>
                      <Form.Control type="text" name="email" value={formData.email} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Ngày sinh</Form.Label>
                      <Form.Control type="date" name="dob" value={formData.dob} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold">Giới tính</Form.Label>
                      <Form.Select 
                         name="gender" 
                         value={formData.gender || ""} 
                         onChange={handleChange}
                      >
                        <option value="" disabled>Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-danger">Trạng thái hệ thống</Form.Label>
                      <Form.Select 
                          name="status" 
                          value={formData.status} 
                          onChange={handleChange}
                          disabled={user?.role !== "Manager" && user?.role !== "Receptionist"}
                      >
                        <option value="Active">Đang hoạt động</option>
                        <option value="Inactive">Không hoạt động (Khóa tài khoản)</option>
                      </Form.Select>
                      {user?.role !== "Manager" && user?.role !== "Receptionist" && (
                         <Form.Text className="text-muted">Chỉ Quản lý và Lễ tân mới được đổi trạng thái.</Form.Text>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Địa chỉ</Form.Label>
                  <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={handleChange} />
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
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
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>Xác nhận hủy
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn hủy bỏ? Các thay đổi chưa lưu sẽ bị mất.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
            Không
          </Button>
          <Button variant="danger" onClick={() => navigate("/customers")}>
            Có, quay lại
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-primary fw-bold">
            <i className="bi bi-question-circle-fill me-2"></i>Xác nhận lưu
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn lưu các thay đổi thông tin của khách hàng <span className="fw-bold">{formData.fullName}</span> không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={confirmSave}>
            Đồng ý lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditCustomerProfile;