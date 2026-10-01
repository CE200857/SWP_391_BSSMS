import { useState, useEffect } from "react";
import { Container, Card, Row, Col, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi API lấy thông tin chi tiết ngay khi trang vừa load xong
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const response = await fetch(
          `/api/profile?accountId=${user.accountId}&role=${user.role}`,
        );
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error("Lỗi khi tải hồ sơ:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Lỗi khi gọi API logout:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      navigate("/");
    }
  };

  if (!user) return null;

  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <Container fluid className="mt-4 px-4">
      <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-5">
          <h2 className="mb-5 fw-bold text-uppercase text-center">
            Hồ sơ cá nhân
          </h2>

          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
              <p className="mt-3 text-muted">Đang tải thông tin...</p>
            </div>
          ) : (
            <Row>
              {/* Cột trái: Avatar và Vai trò */}
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
                <h4 className="fw-bold mt-2">
                  {profileData?.fullName || user.fullName}
                </h4>
                <span className="badge bg-success px-3 py-2 mt-1">
                  {profileData?.role || user.role}
                </span>
              </Col>

              {/* Cột phải: Chi tiết thông tin */}
              <Col md={8} className="ps-md-5 d-flex flex-column">
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">Họ và Tên</label>
                  <div className="p-2 bg-light rounded border">
                    {profileData?.fullName}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">Email</label>
                  <div className="p-2 bg-light rounded border">
                    {profileData?.email}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-muted fw-bold mb-1">
                    Số điện thoại
                  </label>
                  <div className="p-2 bg-light rounded border">
                    {profileData?.phone || "Chưa cập nhật"}
                  </div>
                </div>

                {/* Chỉ hiển thị Ngày sinh, Giới tính, Địa chỉ nếu là Khách hàng */}
                {profileData?.role === "Customer" && (
                  <>
                    <Row>
                      <Col md={6} className="mb-3">
                        <label className="text-muted fw-bold mb-1">
                          Ngày sinh
                        </label>
                        <div className="p-2 bg-light rounded border">
                          {profileData?.dob || "Chưa cập nhật"}
                        </div>
                      </Col>
                      <Col md={6} className="mb-3">
                        <label className="text-muted fw-bold mb-1">
                          Giới tính
                        </label>
                        <div className="p-2 bg-light rounded border">
                          {profileData?.gender === "Male"
                            ? "Nam"
                            : profileData?.gender === "Female"
                              ? "Nữ"
                              : "Khác"}
                        </div>
                      </Col>
                    </Row>
                    <div className="mb-3">
                      <label className="text-muted fw-bold mb-1">Địa chỉ</label>
                      <div className="p-2 bg-light rounded border">
                        {profileData?.address || "Chưa cập nhật"}
                      </div>
                    </div>
                  </>
                )}

                <div className="mb-4">
                  <label className="text-muted fw-bold mb-1">
                    Trạng thái tài khoản
                  </label>
                  <div className="p-2 bg-light rounded border">
                    {profileData?.status === "Active"
                      ? "Đang hoạt động"
                      : "Không hoạt động"}
                  </div>
                </div>

                {/* Khu vực nút bấm */}
                <div className="d-flex justify-content-between mt-auto pt-3">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Quay lại
                  </Button>

                  {/* Gom 2 nút vào chung 1 div để chúng nằm sát nhau bên phải */}
                  <div className="d-flex gap-2">
                    <Button variant="warning" className="text-white">
                      <i className="bi bi-pencil-square me-1"></i> Chỉnh sửa
                    </Button>

                    <Button variant="danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-1"></i> Đăng xuất
                    </Button>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Profile;
