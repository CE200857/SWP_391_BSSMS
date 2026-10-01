import { useNavigate } from "react-router-dom";
import { Container, Navbar } from "react-bootstrap";

const Header = ({ user }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <Navbar bg="white" className="shadow-sm z-3" style={{ position: 'relative' }}>
      <Container fluid className="px-4">
        <Navbar.Brand
          className="fw-bold fs-4"
          style={{ cursor: "pointer", letterSpacing: "1px" }}
          onClick={() => navigate("/")}
          title="Về trang chủ"
        >
          Beauty Salon & Spa
        </Navbar.Brand>

        <Navbar.Collapse className="justify-content-end">
          <div
            className="d-flex align-items-center p-1 bg-light rounded-pill border"
            style={{ cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => navigate("/profile")}
            title="Nhấn để xem hồ sơ cá nhân"
          >
            <div
              className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
              style={{
                width: "38px",
                height: "38px",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              {initial}
            </div>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;