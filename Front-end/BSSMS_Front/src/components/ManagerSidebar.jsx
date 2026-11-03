import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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
  const activeSection = staffSection(role, pathname);
  const activeGroup = activeSection?.group[0];
  const [openGroupState, setOpenGroupState] = useState(null);
  const isManager = role === "Manager";
  const openGroupId =
    openGroupState?.pathname === pathname ? openGroupState.id : activeGroup;

  const toggleGroup = (id) => {
    if (collapsed) {
      onToggle?.();
      setOpenGroupState({ pathname, id });
      return;
    }
    setOpenGroupState({
      pathname,
      id: openGroupId === id ? null : id,
    });
  };

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
          <div className="manager-nav-group" key={id}>
            {isManager ? (
              <button
                type="button"
                title={collapsed ? label : undefined}
                aria-label={label}
                aria-expanded={!collapsed && openGroupId === id}
                aria-controls={`manager-submenu-${id}`}
                className={`manager-group-button ${activeGroup === id ? "current" : ""}`}
                onClick={() => toggleGroup(id)}
              >
                <i className={`bi bi-${icon}`} aria-hidden="true" />
                <span>{label}</span>
                <i
                  className={`bi bi-chevron-down manager-chevron ${!collapsed && openGroupId === id ? "open" : ""}`}
                  aria-hidden="true"
                />
              </button>
            ) : (
              <NavLink
                to={links[0][0]}
                title={label}
                aria-label={label}
                className={`manager-group-button ${activeGroup === id ? "current" : ""}`}
              >
                <i className={`bi bi-${icon}`} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            )}
            {isManager && !collapsed && openGroupId === id ? (
              <div
                className="manager-submenu"
                id={`manager-submenu-${id}`}
                aria-label={`Chức năng ${label}`}
              >
                {links.map(([path, title]) => (
                  <Link
                    key={path}
                    to={path}
                    className={
                      activeSection?.group[0] === id &&
                      activeSection.link[0] === path
                        ? "active"
                        : ""
                    }
                    aria-current={
                      activeSection?.group[0] === id &&
                      activeSection.link[0] === path
                        ? "page"
                        : undefined
                    }
                  >
                    {title}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>
    </aside>
  );
}
