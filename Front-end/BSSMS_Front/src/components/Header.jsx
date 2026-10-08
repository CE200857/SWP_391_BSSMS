import { useNavigate } from "react-router-dom";
import { Container, Navbar } from "react-bootstrap";
import logo from "../images/seoul-center-logo-transparent.png";

const Header = ({ user }) => {
  const navigate = useNavigate();

  if (!user) return null;

  const initial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <Navbar
      bg="white"
      className="app-header z-3"
      style={{ position: "relative" }}
    >
      <Container fluid className="px-4">
        <Navbar.Brand className="app-brand ms-auto" style={{ cursor: "default" }}>
          <img src={logo} alt="Seoul Center" />
        </Navbar.Brand>

        <Navbar.Collapse className="justify-content-end">
          <div
            className="app-user-trigger d-flex align-items-center p-1 rounded-pill"
            style={{ cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => navigate("/profile")}
            title="Nhấn để xem hồ sơ cá nhân"
          >
            <div
              className="app-user-avatar text-white rounded-circle d-flex justify-content-center align-items-center"
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
