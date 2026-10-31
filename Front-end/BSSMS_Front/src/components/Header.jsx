import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import SeoulBrand from "./SeoulBrand";

const guestLinks = [
  { to: "/bssms-guest", label: "Trang chủ", end: true },
  { to: "/guest/services", label: "Danh sách dịch vụ" },
  { to: "/guest/slots", label: "Tra cứu lịch trống" },
  { to: "/guest/feedback", label: "Đánh giá khách hàng" },
];

const customerLinks = [
  { to: "/customer/home", label: "Trang chủ", end: true },
  { to: "/services", label: "Danh sách dịch vụ" },
  { to: "/appointments", label: "Lịch hẹn" },
  { to: "/slots", label: "Tra cứu lịch trống" },
  { to: "/my-feedback", label: "Đánh giá của tôi" },
  { to: "/my-treatment-profile", label: "Hồ sơ liệu trình" },
  { to: "/feedback", label: "Đánh giá khách hàng" },
];

const dashboardTitles = {
  "/manager/dashboard": "Tổng quan",
  "/services": "Danh sách dịch vụ",
  "/appointments": "Danh sách lịch hẹn",
  "/customers": "Danh sách khách hàng",
  "/staffs": "Quản lý nhân viên",
  "/vouchers": "Quản lý voucher",
  "/manager/resources": "Phòng & giường",
  "/profile": "Hồ sơ cá nhân",
};

const Header = ({ user, dashboard = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  if (dashboard) {
    const pageTitle = dashboardTitles[location.pathname] || "Quản lý hệ thống";
    return (
      <header className="app-header app-dashboard-header">
        <div className="app-dashboard-breadcrumb">
          <span>{user?.role === "Manager" ? "Quản lý hệ thống" : "Seoul Center"}</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
          <strong>{pageTitle}</strong>
        </div>
        <div className="app-dashboard-header-actions">
          <span className="app-dashboard-location">
            <i className="bi bi-geo-alt" aria-hidden="true" /> Seoul Center · Cần Thơ
          </span>
          <button className="app-header-icon" type="button" aria-label="Thông báo">
            <i className="bi bi-bell" aria-hidden="true" />
          </button>
          <button
            className="app-user-trigger app-user-trigger-dashboard"
            type="button"
            onClick={() => navigate("/profile")}
            title="Xem hồ sơ cá nhân"
          >
            <span className="app-user-avatar">{initial}</span>
            <span className="app-dashboard-user-name">{user?.fullName || "Tài khoản"}</span>
            <i className="bi bi-chevron-down" aria-hidden="true" />
          </button>
        </div>
      </header>
    );
  }

  const isCustomer = user?.role === "Customer";
  const links = isCustomer ? customerLinks : guestLinks;

  return (
    <header className={`app-header app-public-header${menuOpen ? " menu-open" : ""}`}>
      <div className="app-public-header-inner">
        <Link to={isCustomer ? "/customer/home" : "/bssms-guest"} className="app-public-brand" aria-label="Seoul Center - Trang chủ">
          <SeoulBrand />
        </Link>
        <button
          className="app-public-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`} aria-hidden="true" />
        </button>
        <nav className={`app-public-nav${menuOpen ? " is-open" : ""}`} aria-label="Điều hướng chính">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `app-public-nav-link${isActive ? " active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          {isCustomer ? (
            <>
              <Link
                className="app-public-auth-link app-public-auth-primary"
                to="/appointments/online"
                onClick={() => setMenuOpen(false)}
              >
                Đặt lịch <i className="bi bi-calendar2-check" aria-hidden="true" />
              </Link>
              <button
                className="app-public-account"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                aria-label="Hồ sơ cá nhân"
                title={user?.fullName || "Hồ sơ cá nhân"}
              >
                {initial}
              </button>
            </>
          ) : (
            <>
              <Link
                className="app-public-auth-link"
                to="/register"
                onClick={() => setMenuOpen(false)}
              >
                Đăng ký
              </Link>
              <Link
                className="app-public-auth-link app-public-auth-primary"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Đăng nhập <i className="bi bi-calendar2-check" aria-hidden="true" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
