import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { staffNavigation, staffSection } from "./staffNavigation";
import SeoulBrand from "./SeoulBrand";
import "./Header.css";
import { roleHome } from "../auth/login";

const guestLinks = [
  { to: "/bssms-guest", label: "Home", end: true },
  { to: "/guest/services", label: "Services" },
  { to: "/guest/treatment-packages", label: "Packages" },
  { to: "/guest/feedback", label: "Reviews" },
];

const customerLinks = [
  { to: "/customer/home", label: "Home", end: true },
  { to: "/services", label: "Services" },
  { to: "/treatment-packages", label: "Packages" },
  { to: "/appointments", label: "My Appointments" },
  { to: "/my-treatment-profile", label: "My packages" },
  { to: "/feedback", label: "Reviews" },
];

const customerAccountLinks = [
  ["/profile", "My account", "person"],
  ["/invoices", "My invoices", "receipt"],
  ["/membership-benefits", "Membership benefits", "award"],
];

const dashboardTitles = {
  "/manager/dashboard": "Overview",
  "/services": "Service list",
  "/appointments": "Appointment list",
  "/customers": "Customer list",
  "/staffs": "Staff management",
  "/vouchers": "Voucher management",
  "/manager/resources": "Rooms & beds",
  "/receptionist/coordination": "Check-in & coordination",
  "/treatment-status": "Service status",
  "/manager/scheduling": "Shifts & skills",
  "/manager/leaves": "Leave approval",
  "/manager/tour-report": "Tour report",
  "/tour-report": "Tour report",
  "/my-schedule": "Shifts & leave",
  "/invoices/create": "Payments",
  "/profile": "My profile",
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
  const isCustomer = user?.role === "Customer";
  const accountId = user?.accountId || user?.account_id;
  const [loadedMembershipTier, setLoadedMembershipTier] = useState(null);
  const closeMenu = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };
  useEffect(() => {
    if (!isCustomer || !accountId) return undefined;

    const controller = new AbortController();
    const query = new URLSearchParams({
      accountId: String(accountId),
      role: "Customer",
    });

    fetch(`/api/profile?${query}`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(
            data?.message || `Could not load membership tiers (HTTP ${response.status}).`,
          );
        }
        return data;
      })
      .then((profile) => {
        setLoadedMembershipTier({
          accountId,
          tierName:
            profile?.membership?.tierName || profile?.membershipTierName || "",
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error loading membership tiers:", error);
        }
      });

    return () => controller.abort();
  }, [accountId, isCustomer, user?.membership?.tierName, user?.tierName]);
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
  const membershipTierName =
    loadedMembershipTier && loadedMembershipTier.accountId === accountId
      ? loadedMembershipTier.tierName
      : user?.membership?.tierName || user?.tierName || "";
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
        throw new Error("Could not log out. Please try again.");
      localStorage.removeItem("user");
      setUser(null);
      closeMenu();
      navigate("/bssms-guest", { replace: true });
    } catch {
      setLogoutError("Could not log out. Please try again.");
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
        : "Account");
    return (
      <header className="app-header app-dashboard-header">
        <button
          className="dashboard-mobile-menu"
          type="button"
          onClick={onMenuToggle}
          aria-controls="staff-sidebar"
          aria-expanded={mobileMenuOpen}
          aria-label={
            mobileMenuOpen ? "Close menu" : "Open menu"
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
            Can Tho
          </span>
          {user?.role === "Manager" && (
            <Link
              to="/manager/leaves"
              className="app-header-icon"
              aria-label="Leave requests pending approval"
            >
              <i className="bi bi-bell" aria-hidden="true" />
            </Link>
          )}
          <button
            className="app-user-trigger app-user-trigger-dashboard"
            type="button"
            onClick={() => navigate("/profile")}
            title="View my profile"
          >
            <span className="app-user-avatar">{initial}</span>
            <span className="app-dashboard-user-name">
              {user?.fullName || "Account"}
            </span>
            <i className="bi bi-chevron-down" aria-hidden="true" />
          </button>
        </div>
      </header>
    );
  }

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
          aria-label="Seoul Center - Home"
        >
          <SeoulBrand />
        </Link>
        <button
          className="app-public-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
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
          aria-label="Main navigation"
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
                Sign up
              </Link>
              <Link
                className="app-public-auth-link app-public-auth-primary"
                to="/login"
                onClick={closeMenu}
              >
                Log in{" "}
                <i className="bi bi-calendar2-check" aria-hidden="true" />
              </Link>
            </>
          )}
          {user && !isCustomer && <Link className="app-public-auth-link" to={roleHome(user.role)} onClick={closeMenu}>Back to dashboard</Link>}
        </nav>
        {isCustomer && <Link to="/appointments/online" className="customer-booking-link" onClick={closeMenu}><i className="bi bi-calendar-plus" aria-hidden="true" /><span>Book</span></Link>}
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
              aria-label="Account menu"
              title={user.fullName || "Your account"}
              onClick={() => {
                setAccountOpen((open) => !open);
                setMenuOpen(false);
              }}
            >
              <span className="customer-account-avatar">{initial}</span>
              <span className="customer-account-identity">
                <span className="customer-account-name-line">
                  <strong>{user.fullName || "Your account"}</strong>
                  {membershipTierName && (
                    <>
                      <span className="customer-account-tier-separator" aria-hidden="true">·</span>
                      <small className="customer-account-tier">{membershipTierName}</small>
                    </>
                  )}
                </span>
                <small>Customer</small>
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
                  <div>
                    <div className="customer-account-heading-name">
                      <strong>{user.fullName || "Your account"}</strong>
                      {membershipTierName && (
                        <>
                          <span className="customer-account-tier-separator" aria-hidden="true">·</span>
                          <span className="customer-account-tier">{membershipTierName}</span>
                        </>
                      )}
                    </div>
                    <span>{user.email || "Seoul Center customer"}</span></div>
                </div>
                <nav
                  aria-label="Account menu"
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
                    {loggingOut ? "Logging out…" : "Log out"}
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
