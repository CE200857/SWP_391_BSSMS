import { Link, useLocation } from "react-router-dom";
import { staffNavigation, staffSection } from "./staffNavigation";

export default function ManagerSectionNav({ role = "Manager" }) {
  const { pathname } = useLocation();
  const config = staffNavigation[role];
  const section = staffSection(role, pathname);
  if (!config || pathname === config.home) return null;
  if (!section) {
    const accountPage = [
      "/profile",
      "/edit-profile",
      "/change-password",
    ].includes(pathname);
    return (
      <section
        className="manager-section-nav"
        aria-label={accountPage ? "Tài khoản" : "Tổng quan"}
      >
        <div className="manager-section-title">
          <strong>
            {accountPage ? "Tài khoản cá nhân" : config.homeLabel}
          </strong>
        </div>
        <nav>
          {(accountPage
            ? [
                ["/profile", "Hồ sơ cá nhân"],
                ["/edit-profile", "Cập nhật hồ sơ"],
                ["/change-password", "Đổi mật khẩu"],
              ]
            : [
                [
                  config.home,
                  role === "Manager"
                    ? "Báo cáo hoạt động"
                    : "Tổng quan công việc",
                ],
              ]
          ).map(([path, title]) => (
            <Link
              key={path}
              className={pathname === path ? "selected" : ""}
              aria-current={pathname === path ? "page" : undefined}
              to={path}
            >
              {title}
            </Link>
          ))}
        </nav>
      </section>
    );
  }
  const [, label, icon, links] = section.group;
  return (
    <section className="manager-section-nav" aria-label={label}>
      <div className="manager-section-title">
        <i className={`bi bi-${icon}`} aria-hidden="true" />
        <strong>{label}</strong>
      </div>
      <nav aria-label={`Chức năng ${label}`}>
        {links.map(([path, title]) => (
          <Link
            key={path}
            to={path}
            className={section.link[0] === path ? "selected" : ""}
            aria-current={section.link[0] === path ? "page" : undefined}
          >
            {title}
          </Link>
        ))}
      </nav>
    </section>
  );
}
