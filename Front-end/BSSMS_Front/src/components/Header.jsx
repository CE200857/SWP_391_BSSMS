import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { staffNavigation, staffSection } from "./staffNavigation";
import SeoulBrand from "./SeoulBrand";
import "./Header.css";
import { roleHome } from "../auth/login";

const guestLinks = [
  { to: "/bssms-guest", label: "Trang chủ", end: true },
  { to: "/guest/services", label: "Danh sách dịch vụ" },
  { to: "/guest/feedback", label: "Đánh giá khách hàng" },
];

const customerLinks = [
  { to: "/customer/home", label: "Trang chủ", end: true },
  { to: "/services", label: "Dịch vụ" },
  { to: "/appointments", label: "Lịch hẹn" },
  { to: "/my-treatment-profile", label: "Liệu trình của tôi" },
];

const customerAccountLinks = [
  ["/profile", "Tài khoản của tôi", "person"],
  ["/invoices", "Hóa đơn của tôi", "receipt"],
  ["/my-feedback", "Đánh giá của tôi", "star"],
  ["/membership-benefits", "Quyền lợi thành viên", "award"],
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

const Header = ({
  user,
  setUser,
  dashboard = false,
  onMenuToggle,
  mobileMenuOpen = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const closeMenu = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };
  useEffect(() => {
    if (!accountOpen) return;
    const outside = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok && response.status !== 401)
        throw new Error("Chưa đăng xuất được. Bạn thử lại nhé.");
      localStorage.removeItem("user");
      setUser(null);
      closeMenu();
      navigate("/bssms-guest", { replace: true });
    } catch {
      setLogoutError("Chưa đăng xuất được. Bạn thử lại nhé.");
    } finally {
      setLoggingOut(false);
    }
  };
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  if (dashboard) {
    const pageTitle =
      dashboardTitles[location.pathname] ||
      staffSection(user?.role, location.pathname)?.link[1] ||
      (location.pathname === staffNavigation[user?.role]?.home
        ? staffNavigation[user.role].homeLabel
        : "Tài khoản");
    return (
      <header className="app-header app-dashboard-header">
        <button
          className="dashboard-mobile-menu"
          type="button"
          onClick={onMenuToggle}
          aria-controls="staff-sidebar"
          aria-expanded={mobileMenuOpen}
          aria-label={
            mobileMenuOpen ? "Đóng menu chức năng" : "Mở menu chức năng"
          }
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
        <div className="app-dashboard-breadcrumb">
          <span>{staffNavigation[user?.role]?.label || "Seoul Center"}</span>
          <i className="bi bi-chevron-right" aria-hidden="true" />
          <strong>{pageTitle}</strong>
        </div>
        <div className="app-dashboard-header-actions">
          <span className="app-dashboard-location">
            <i className="bi bi-geo-alt" aria-hidden="true" /> Seoul Center ·
            Cần Thơ
          </span>
          {user?.role === "Manager" && (
            <Link
              to="/manager/policy"
              className="app-header-icon"
              aria-label="Theo dõi thông báo"
            >
              <i className="bi bi-bell" aria-hidden="true" />
            </Link>
          )}
          <button
            className="app-user-trigger app-user-trigger-dashboard"
            type="button"
            onClick={() => navigate("/profile")}
            title="Xem hồ sơ cá nhân"
          >
            <span className="app-user-avatar">{initial}</span>
            <span className="app-dashboard-user-name">
              {user?.fullName || "Tài khoản"}
            </span>
            <i className="bi bi-chevron-down" aria-hidden="true" />
          </button>
        </div>
      </header>
    );
  }

  const isCustomer = user?.role === "Customer";
  const links = isCustomer ? customerLinks : guestLinks;

  return (
    <header
      className={`app-header app-public-header${isCustomer ? " customer-header" : ""}${menuOpen ? " menu-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") closeMenu();
      }}
    >
      <div className="app-public-header-inner">
        <Link
          to={isCustomer ? "/customer/home" : "/bssms-guest"}
          className="app-public-brand"
          onClick={closeMenu}
          aria-label="Seoul Center - Trang chủ"
        >
          <SeoulBrand />
        </Link>
        <button
          className="app-public-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          aria-controls="public-navigation"
          onClick={() => {
            setMenuOpen((open) => !open);
            setAccountOpen(false);
          }}
        >
          <i
            className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"}`}
            aria-hidden="true"
          />
        </button>
        <nav
          id="public-navigation"
          className={`app-public-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Điều hướng chính"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `app-public-nav-link${isActive && !(link.to === "/appointments" && location.pathname === "/appointments/online") ? " active" : ""}`
              }
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          ))}
          {!user && (
            <>
              <Link
                className="app-public-auth-link"
                to="/register"
                onClick={closeMenu}
              >
                Đăng ký
              </Link>
              <Link
                className="app-public-auth-link app-public-auth-primary"
                to="/login"
                onClick={closeMenu}
              >
                Đăng nhập{" "}
                <i className="bi bi-calendar2-check" aria-hidden="true" />
              </Link>
            </>
          )}
          {user && !isCustomer && <Link className="app-public-auth-link" to={roleHome(user.role)} onClick={closeMenu}>Về dashboard</Link>}
        </nav>
        {isCustomer && <Link to="/appointments/online" className="customer-booking-link" onClick={closeMenu}><i className="bi bi-calendar-plus" aria-hidden="true" /><span>Đặt lịch</span></Link>}
        {isCustomer && (
          <div
            className="customer-account"
            ref={accountRef}
            onBlur={(event) => {
              if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget))
                setAccountOpen(false);
            }}
          >
            <button
              ref={accountButtonRef}
              className={`customer-account-trigger${accountOpen ? " is-open" : ""}`}
              type="button"
              aria-expanded={accountOpen}
              aria-controls="customer-account-panel"
              aria-label="Menu tài khoản"
              title={user.fullName || "Tài khoản của bạn"}
              onClick={() => {
                setAccountOpen((open) => !open);
                setMenuOpen(false);
              }}
            >
              <span className="customer-account-avatar">{initial}</span>
              <span className="customer-account-identity">
                <strong>{user.fullName || "Tài khoản của bạn"}</strong>
                <small>Khách hàng</small>
              </span>
              <i className="bi bi-chevron-down" aria-hidden="true" />
            </button>
            {accountOpen && (
              <div
                className="customer-account-panel"
                id="customer-account-panel"
              >
                <div className="customer-account-heading">
                  <span className="customer-account-avatar" aria-hidden="true">{initial}</span>
                  <div><strong>{user.fullName || "Tài khoản của bạn"}</strong>
                    <span>{user.email || "Khách hàng Seoul Center"}</span></div>
                </div>
                <nav
                  aria-label="Chức năng tài khoản"
                  className="customer-account-links"
                >
                  {customerAccountLinks.map(([to, label, icon]) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/appointments"}
                      onClick={closeMenu}
                    >
                      <i className={`bi bi-${icon}`} aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
                <div className="customer-account-footer">
                  {logoutError && <p role="alert">{logoutError}</p>}
                  <button type="button" onClick={logout} disabled={loggingOut}>
                    <i className="bi bi-box-arrow-right" aria-hidden="true" />
                    {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
