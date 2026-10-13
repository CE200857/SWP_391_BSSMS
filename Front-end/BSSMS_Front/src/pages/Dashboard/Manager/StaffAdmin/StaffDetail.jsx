import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Card, Row, Col, Form, Button, Badge, Spinner } from "react-bootstrap";

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffDetail = async () => {
      try {
        const response = await fetch(`http://localhost:8080/BSSMS-back/api/staff?id=${id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStaff(data);
        } else {
          alert("Không tìm thấy thông tin nhân viên!");
          navigate("/staffs");
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết nhân viên:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!staff) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <Container className="mt-4 px-4 d-flex justify-content-center">
      <Card className="shadow border-0 w-75" style={{ borderRadius: "15px" }}>
        <Card.Header className="bg-dark text-white p-3 rounded-top" style={{ borderTopLeftRadius: "15px", borderTopRightRadius: "15px" }}>
          <h4 className="mb-0 fw-bold"><i className="bi bi-person-vcard me-2"></i> Hồ sơ chi tiết nhân viên</h4>
        </Card.Header>

        <Card.Body className="p-4 bg-light">
          <Row>
            {/* Cột trái */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Staff ID</Form.Label>
                <Form.Control type="text" value={staff.staffId} readOnly className="bg-white" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Họ và Tên</Form.Label>
                <Form.Control type="text" value={staff.fullName} readOnly className="bg-white fw-bold text-primary" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Username</Form.Label>
                <Form.Control type="text" value={staff.username} readOnly className="bg-white" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Email</Form.Label>
                <Form.Control type="email" value={staff.email} readOnly className="bg-white" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Số điện thoại (Phone)</Form.Label>
                <Form.Control type="text" value={staff.phone} readOnly className="bg-white" />
              </Form.Group>
            </Col>

            {/* Cột phải */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Chức vụ (Role)</Form.Label>
                <Form.Control type="text" value={staff.role} readOnly className="bg-white" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Trạng thái (Status)</Form.Label>
                <div className="form-control bg-white">
                  {staff.status === "Active" ? (
                    <Badge bg="success">Đang hoạt động</Badge>
                  ) : (
                    <Badge bg="danger">Không hoạt động</Badge>
                  )}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Ngày vào làm (Hire Date)</Form.Label>
                <Form.Control type="text" value={staff.hireDate || "Chưa cập nhật"} readOnly className="bg-white" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Mức lương (Salary)</Form.Label>
                <Form.Control type="text" value={formatCurrency(staff.salary)} readOnly className="bg-white text-danger fw-bold" />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold text-muted">Mật khẩu (Password - Hashed MD5)</Form.Label>
                <Form.Control 
                    type="text" 
                    value={staff.password} 
                    readOnly 
                    className="bg-white text-secondary" 
                    style={{ fontSize: "0.85rem", fontStyle: "italic" }} 
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" onClick={() => navigate("/staffs")}>
              <i className="bi bi-arrow-left me-1"></i> Trở về danh sách
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StaffDetail;