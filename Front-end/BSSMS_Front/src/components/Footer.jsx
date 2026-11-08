import { Link } from "react-router-dom";
import SeoulBrand from "./SeoulBrand";
import { SITE } from "../siteConfig";

const SOCIALS = [
  { key: "facebook", label: "Facebook", url: SITE.facebookUrl, icon: "bi bi-facebook" },
  { key: "instagram", label: "Instagram", url: SITE.instagramUrl, icon: "bi bi-instagram" },
  { key: "zalo", label: "Zalo", url: SITE.zaloUrl, text: "Zalo" },
].filter((item) => item.url);

const Footer = ({ user }) => (
  <footer className="app-footer">
    <div className="app-footer-inner">
      <div className="app-footer-brand">
        <SeoulBrand inverse />
        <p>
          Chăm chút vẻ đẹp. Trân trọng cảm xúc. Đồng hành cùng những phút giây
          bạn dành cho chính mình.
        </p>
        <div className="app-footer-socials" aria-label="Mạng xã hội">
          {SOCIALS.map((item) => (
            <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`${item.label} của ${SITE.name}`}>
              {item.icon ? <i className={item.icon} aria-hidden="true" /> : item.text}
            </a>
          ))}
        </div>
      </div>

      <div className="app-footer-column">
        <h2>Khám phá</h2>
        <Link to={user?.role === "Customer" ? "/services" : "/guest/services"}>Dịch vụ</Link>
        <Link to={user?.role === "Customer" ? "/customer/home" : "/bssms-guest"}>Về Seoul Center</Link>
        <Link to={user?.role === "Customer" ? "/feedback" : "/guest/feedback"}>Phản hồi khách hàng</Link>
        <Link to="/slots">Đặt lịch chăm sóc</Link>
      </div>

      <div className="app-footer-column">
        <h2>Hỗ trợ khách hàng</h2>
        <Link to="/faq">Câu hỏi thường gặp</Link>
        <Link to="/privacy">Chính sách bảo mật</Link>
        <Link to="/terms">Điều khoản sử dụng</Link>
        {!user && <Link to="/login">Đăng nhập</Link>}
      </div>

      <div className="app-footer-column app-footer-location">
        <h2>Seoul Center · Cần Thơ</h2>
        <p>{SITE.address}</p>
        <a href={`tel:${SITE.phoneLink}`}>{SITE.phoneDisplay}</a>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
        <p>{SITE.hours}</p>
      </div>
    </div>
    <div className="app-footer-bottom">
      <span>© {new Date().getFullYear()} Seoul Center. Bản quyền thuộc về Seoul Center.</span>
      <span>Một chút chăm sóc, thật nhiều yêu thương.</span>
    </div>
  </footer>
);

export default Footer;
