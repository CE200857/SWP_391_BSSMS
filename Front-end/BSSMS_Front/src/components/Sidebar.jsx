import { NavLink } from "react-router-dom";

const Sidebar = ({ user, collapsed = false, onToggle }) => {
  if (!user) return null;

  const role = user.role;

  const isCustomer = role === "Customer";
  const isTechnician = role === "Technician";
  const isReceptionist = role === "Receptionist";
  const isManager = role === "Manager";

  const navClass = ({ isActive }) =>
    `app-nav-link d-flex align-items-center rounded text-decoration-none fw-bold ${isActive ? "active" : ""}`;

  const renderMenuLabel = (label) => (
    <span className="app-nav-label">{label}</span>
  );

  return (
    <aside
      className={`app-sidebar border-end shadow-sm ${collapsed ? "collapsed" : ""}`}
      style={{
        minHeight: "100vh",
        zIndex: 10,
      }}
    >
      <div className="app-sidebar-inner p-3 mt-2 text-start">
        <div className="app-sidebar-heading d-flex align-items-center justify-content-between mb-4">
          <p
            className="app-sidebar-title text-muted fw-bold text-uppercase mb-0 ms-2"
            style={{ fontSize: "13px" }}
          >
            {isCustomer
              ? "Menu Khách hàng"
              : isTechnician
                ? "Menu Kỹ thuật viên"
                : isReceptionist
                  ? "Menu Lễ tân"
                  : "Quản lý hệ thống"}
          </p>
          <button
            type="button"
            className="app-sidebar-toggle btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
            onClick={onToggle}
            aria-label={collapsed ? "Mở rộng Side Bar" : "Thu nhỏ Side Bar"}
            title={collapsed ? "Mở rộng Side Bar" : "Thu nhỏ Side Bar"}
          >
            <i className="bi bi-list fs-4" />
          </button>
        </div>

        <div className="d-flex flex-column gap-2">
          <NavLink to="/services" className={navClass} title="Danh sách dịch vụ">
            <i className="bi bi-scissors me-2"></i>
            {renderMenuLabel("Danh sách dịch vụ")}
          </NavLink>

          {isCustomer && (
            <NavLink to="/my-feedback" className={navClass} title="Đánh giá của tôi">
              <i className="bi bi-star-fill me-2"></i>
              {renderMenuLabel("Đánh giá của tôi")}
            </NavLink>
          )}

          <NavLink
            to="/appointments"
            end
            className={navClass}
            title="Danh sách lịch hẹn"
          >
            <i className="bi bi-calendar-check-fill me-2"></i>
            {renderMenuLabel("Danh sách lịch hẹn")}
          </NavLink>

          {(isReceptionist || isManager) && (
            <NavLink
              to="/appointments/create"
              className={navClass}
              title="Tạo lịch hẹn walk-in"
            >
              <i className="bi bi-calendar-plus me-2"></i>
              {renderMenuLabel("Tạo lịch hẹn")}
            </NavLink>
          )}

          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass} title="Đánh giá khách hàng">
              <i className="bi bi-chat-quote-fill me-2"></i>
              {renderMenuLabel("Đánh giá khách hàng")}
            </NavLink>
          )}

          {(isReceptionist || isManager) && (
            <NavLink to="/customers" className={navClass} title="Danh sách khách hàng">
              <i className="bi bi-people-fill me-2"></i>
              {renderMenuLabel("Danh sách khách hàng")}
            </NavLink>
          )}

          {isManager && (
            <>
              <NavLink to="/staffs" className={navClass} title="Danh sách nhân viên">
                <i className="bi bi-person-badge-fill me-2"></i>
                {renderMenuLabel("Danh sách nhân viên")}
              </NavLink>

              <NavLink to="/manager/products" className={navClass} title="Quản lý Sản phẩm">
                <i className="bi bi-box-seam me-2"></i>
                {renderMenuLabel("Quản lý Sản phẩm")}
              </NavLink>

              <NavLink to="/manager/suppliers" className={navClass} title="Quản lý Nhà cung cấp">
                <i className="bi bi-truck me-2"></i>
                {renderMenuLabel("Quản lý Nhà cung cấp")}
              </NavLink>

              <NavLink to="/manager/treatment-packages" className={navClass} title="Quản lý Gói liệu trình">
                <i className="bi bi-box2-heart-fill me-2"></i>
                {renderMenuLabel("Quản lý Gói liệu trình")}
              </NavLink>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;