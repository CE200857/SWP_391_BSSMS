import { NavLink, useLocation } from "react-router-dom";
import { staffNavigation, staffSection } from "./staffNavigation";
import SeoulBrand from "./SeoulBrand";

export default function ManagerSidebar({
  role = "Manager",
  collapsed,
  onToggle,
  onNavigate,
}) {
  const { pathname } = useLocation();
  const config = staffNavigation[role];
  const activeGroup = staffSection(role, pathname)?.group[0];
  return (
    <aside
      id="staff-sidebar"
      onClick={(event) => {
        if (event.target.closest("a")) onNavigate?.();
      }}
      className={`app-sidebar manager-sidebar ${collapsed ? "collapsed" : ""}`}
    >
      <div className="manager-sidebar-head">
        <NavLink
          className="app-sidebar-brand"
          to={config.home}
          aria-label="Về tổng quan"
        >
          <SeoulBrand />
        </NavLink>
        <button
          className="manager-menu-toggle"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
      </div>
      <div className="staff-sidebar-role">{config.label}</div>
      <nav aria-label={`Chức năng ${config.label}`}>
        <NavLink
          to={config.home}
          className="manager-home-link"
          end
          title={config.homeLabel}
          aria-label={config.homeLabel}
        >
          <i className="bi bi-grid" aria-hidden="true" />
          <span>{config.homeLabel}</span>
        </NavLink>
        {config.groups.map(([id, label, icon, links]) => (
          <NavLink
            key={id}
            to={links[0][0]}
            title={label}
            aria-label={label}
            className={`manager-group-button ${activeGroup === id ? "current" : ""}`}
          >
            <i className={`bi bi-${icon}`} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
