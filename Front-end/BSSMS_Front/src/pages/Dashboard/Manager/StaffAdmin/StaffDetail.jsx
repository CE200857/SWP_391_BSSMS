import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import "./StaffAdmin.css";

const roleLabels = {
  Manager: "Quản lý",
  Receptionist: "Lễ tân",
  Technician: "Kỹ thuật viên",
};

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaffDetail = async () => {
      try {
        const response = await fetch(`/api/staff?id=${id}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setStaff(data);
        } else {
          setError("Không tìm thấy thông tin nhân viên.");
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết nhân viên:", error);
        setError("Không thể tải hồ sơ nhân viên. Vui lòng kiểm tra kết nối và thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <Container className="staff-admin d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (!staff) {
    return (
      <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
        <Alert variant="danger" role="alert">
          {error || "Không tìm thấy thông tin nhân viên."}
        </Alert>
        <Button variant="outline-secondary" onClick={() => navigate("/staffs")}>
          <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Trở về danh sách
        </Button>
      </Container>
    );
  }

  const role = staff.role || staff.position;
  const hireDate = staff.hireDate
    ? staff.hireDate.substring(0, 10).split("-").reverse().join("/")
    : "Chưa cập nhật";

  return (
    <Container fluid className="staff-admin mt-4 px-3 px-lg-4">
      <div className="staff-page-heading">
        <div>
          <h2>Hồ sơ nhân viên</h2>
          <p>Thông tin liên hệ và công việc của nhân sự.</p>
        </div>
      </div>

      <Card className="staff-detail-card">
        <div className="staff-detail-banner">
          <div className="staff-detail-identity">
            <div className="staff-detail-avatar" aria-hidden="true">
              {staff.fullName?.trim()?.charAt(0)?.toUpperCase() || "N"}
            </div>
            <div>
              <h3>{staff.fullName || "Nhân viên"}</h3>
              <p>{roleLabels[role] || role || "Chưa cập nhật"} · Mã nhân viên #{staff.staffId}</p>
            </div>
          </div>
          {staff.status && (
            <Badge className={`staff-status-badge${staff.status !== "Active" ? " is-inactive" : ""}`}>
              {staff.status === "Active" ? "Đang hoạt động" : "Không hoạt động"}
            </Badge>
          )}
        </div>

        <Card.Body className="staff-detail-content">
          <h3 className="staff-detail-section-title">
            <i className="bi bi-person-lines-fill me-2" aria-hidden="true"></i>
            Thông tin chi tiết
          </h3>
          <div className="staff-detail-grid">
            <div className="staff-detail-item">
              <span>Mã nhân viên</span>
              <strong>#{staff.staffId}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Tên đăng nhập</span>
              <strong>{staff.username || "Chưa cập nhật"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Email</span>
              <strong>{staff.email || "Chưa cập nhật"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Số điện thoại</span>
              <strong>{staff.phone || "Chưa cập nhật"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Chức vụ</span>
              <strong>{roleLabels[role] || role || "Chưa cập nhật"}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Ngày vào làm</span>
              <strong>{hireDate}</strong>
            </div>
            <div className="staff-detail-item">
              <span>Trạng thái</span>
              <strong>{staff.status === "Active" ? "Đang làm việc" : staff.status === "Locked" ? "Bị khóa" : "Ngừng làm việc"}</strong>
            </div>
          </div>

          <div className="staff-detail-footer">
            <Button variant="outline-secondary" onClick={() => navigate("/staffs")}>
              <i className="bi bi-arrow-left me-1" aria-hidden="true"></i>Trở về danh sách
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default StaffDetail;
