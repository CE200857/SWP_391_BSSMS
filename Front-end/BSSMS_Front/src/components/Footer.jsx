import { Link } from "react-router-dom";
import SeoulBrand from "./SeoulBrand";

const Footer = () => (
  <footer className="app-footer">
    <div className="app-footer-inner">
      <div className="app-footer-brand">
        <SeoulBrand inverse />
        <p>
          Chăm chút vẻ đẹp. Trân trọng cảm xúc. Đồng hành cùng những phút giây
          bạn dành cho chính mình.
        </p>
        <div className="app-footer-socials" aria-label="Mạng xã hội">
          <span aria-label="Facebook"><i className="bi bi-facebook" aria-hidden="true" /></span>
          <span aria-label="Instagram"><i className="bi bi-instagram" aria-hidden="true" /></span>
          <span aria-label="Zalo">Zalo</span>
        </div>
      </div>

      <div className="app-footer-column">
        <h2>Khám phá</h2>
        <Link to="/guest/services">Dịch vụ</Link>
        <Link to="/bssms-guest">Về Seoul Center</Link>
        <Link to="/guest/feedback">Phản hồi khách hàng</Link>
        <Link to="/guest/slots">Đặt lịch chăm sóc</Link>
      </div>

      <div className="app-footer-column">
        <h2>Hỗ trợ khách hàng</h2>
        <span>Câu hỏi thường gặp</span>
        <span>Chính sách bảo mật</span>
        <span>Điều khoản sử dụng</span>
        <Link to="/login">Đăng nhập</Link>
      </div>

      <div className="app-footer-column app-footer-location">
        <h2>Seoul Center · Cần Thơ</h2>
        <p>329 Nguyễn Văn Cừ, Phường Cái Khế, Thành Phố Cần Thơ</p>
        <a href="tel:+84914269346">(+84) 914 269 346</a>
        <a href="mailto:cskh@seoulcenter.vn">cskh@seoulcenter.vn</a>
        <p>08:45–18:30 hằng ngày</p>
      </div>
    </div>
    <div className="app-footer-bottom">
      <span>© {new Date().getFullYear()} Seoul Center. Bản quyền thuộc về Seoul Center.</span>
      <span>Một chút chăm sóc, thật nhiều yêu thương.</span>
    </div>
  </footer>
);

export default Footer;
