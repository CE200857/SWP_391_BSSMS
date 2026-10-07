import { Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import logo from "../images/seoul-center-logo-transparent.png";

const Footer = () => {
  return (
    <footer className="app-footer mt-auto py-4 py-lg-5">
      <Container>
        <div className="row gy-4 app-footer-grid">
          <div className="col-12 col-md-4 app-footer-column">
            <img className="app-footer-logo mb-3" src={logo} alt="Seoul Center" />
            <p className="mb-0 text-white-50">
              Hệ thống quản lý dịch vụ làm đẹp Seoul Center.
            </p>
            <p className="small text-white-50 mt-2 mb-0">
              <i className="bi bi-geo-alt-fill me-2" aria-hidden="true" />
              <span className="text-white">Cần Thơ:</span>
              <br />
              <span className="ms-4">
                329 Nguyễn Văn Cừ, Phường Cái Khế, Thành Phố Cần Thơ
              </span>
            </p>
          </div>
          <div className="col-12 col-md-4 app-footer-column">
            <h2 className="h6 text-white fw-bold mb-3">THÔNG TIN LIÊN HỆ</h2>
            <div className="d-flex flex-column align-items-start gap-2">
              <a className="app-footer-link" href="tel:+84914269346">
                <i className="bi bi-telephone-fill me-2" aria-hidden="true" />
                (+84) 914 269 346
              </a>
              <a className="app-footer-link" href="mailto:cskh@seoulcenter.vn">
                <i className="bi bi-envelope-fill me-2" aria-hidden="true" />
                cskh@seoulcenter.vn
              </a>
              <p className="mb-0 text-white-50">
                <i className="bi bi-clock-fill me-2" aria-hidden="true" />
                <span className="text-white">Thời gian làm việc:</span>
                <br />
                <span className="ms-4">Từ 08:45 đến 18:30 hằng ngày</span>
              </p>
            </div>
          </div>
          <div className="col-12 col-md-4 app-footer-column">
            <h2 className="h6 text-white fw-bold mb-3">KHÁM PHÁ & HỖ TRỢ</h2>
            <div className="d-flex flex-column align-items-start gap-2">
              <Link className="app-footer-link" to="/guest/services">Danh sách dịch vụ</Link>
              <Link className="app-footer-link" to="/guest/feedback">Đánh giá khách hàng</Link>
              <Link className="app-footer-link" to="/login">Đăng nhập</Link>
            </div>
          </div>
        </div>
        <hr className="app-footer-divider my-4" />
        <p className="mb-0 text-center small text-white-50">
          &copy; {new Date().getFullYear()} Seoul Center. Bản quyền thuộc về Nhóm phát triển dự án.
        </p>
      </Container>
    </footer>
  );
};

export default Footer;