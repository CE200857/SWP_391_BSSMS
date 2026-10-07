import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import axios from "axios";

// Nhận prop setUser từ AppRoutes
const CreateProfile = ({ setUser }) => {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Female");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      // Gọi API POST /api/profile (trỏ vào hàm doPost của ProfileServlet)
      const response = await axios.post(
        "http://localhost:8080/BSSMS-back/api/profile",
        { fullName, dob, gender, phone, address },
        { withCredentials: true }
      );

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg("Cập nhật thông tin thành công!");
        
        // Nhận object user mới (đã có role=Customer) từ Backend
        const updatedUser = response.data;
        
        // Cập nhật LocalStorage và State để App nhận diện là đã đăng nhập hợp lệ
        localStorage.setItem("user", JSON.stringify(updatedUser));
        if (setUser) {
            setUser(updatedUser);
        }
        
        // Chuyển hướng thẳng vào trang chủ của Customer
        setTimeout(() => {
          navigate("/customer/home");
        }, 1500);
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#fdf6f7" }}>
      <Card className="shadow-sm" style={{ width: "500px", padding: "30px", borderRadius: "12px", border: "none" }}>
        <h3 className="text-center mb-4 fw-bold text-uppercase" style={{ color: "#3a2a2f" }}>
          Thông tin cá nhân
        </h3>
        
        <p className="text-center text-muted mb-4" style={{ fontSize: "14px" }}>
          Vui lòng cung cấp thông tin để hoàn tất việc đăng ký tài khoản.
        </p>

        {error && <Alert variant="danger">{error}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        <Form onSubmit={handleProfileSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Họ và tên*</Form.Label>
            <Form.Control type="text" placeholder="Nhập họ và tên của bạn" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isLoading || successMsg !== ""} />
          </Form.Group>

          <div className="d-flex gap-3 mb-3">
            <Form.Group className="flex-grow-1">
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Ngày sinh*</Form.Label>
              <Form.Control type="date" value={dob} onChange={(e) => setDob(e.target.value)} required disabled={isLoading || successMsg !== ""} />
            </Form.Group>

            <Form.Group style={{ width: "150px" }}>
              <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Giới tính*</Form.Label>
              <Form.Select value={gender} onChange={(e) => setGender(e.target.value)} disabled={isLoading || successMsg !== ""}>
                <option value="Female">Nữ</option>
                <option value="Male">Nam</option>
                <option value="Other">Khác</option>
              </Form.Select>
            </Form.Group>
          </div>

          <Form.Group className="mb-3">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Số điện thoại*</Form.Label>
            <Form.Control type="tel" placeholder="Nhập số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isLoading || successMsg !== ""} />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-bold" style={{ fontSize: "14px" }}>Địa chỉ</Form.Label>
            <Form.Control type="text" placeholder="Nhập địa chỉ của bạn" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isLoading || successMsg !== ""} />
          </Form.Group>

          <Button type="submit" className="w-100 fw-bold" style={{ backgroundColor: "#a61e4d", border: "none", borderRadius: "6px", padding: "10px" }} disabled={isLoading || successMsg !== ""}>
            {isLoading ? "Đang lưu..." : successMsg ? "Đang chuyển trang..." : "Hoàn tất"}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};

export default CreateProfile;