import { NavLink } from "react-router-dom";

const Sidebar = ({ user }) => {
  // Ẩn Sidebar nếu chưa đăng nhập
  if (!user) return null;

  const role = user.role;

  const isCustomer = role === "Customer";
  const isTechnician = role === "Technician";
  const isReceptionist = role === "Receptionist";
  const isManager = role === "Manager";

  // Class dùng chung cho các menu
  const navClass = ({ isActive }) =>
    `app-nav-link d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${isActive ? "active" : ""
    }`;

  return (
    <div
      className="app-sidebar border-end shadow-sm"
      style={{
        width: "fit-content",
        minWidth: "260px",
        minHeight: "100vh",
        zIndex: 10
      }}
    >
      <div className="p-3 mt-2 text-start">

        {/* Tiêu đề Sidebar */}
        <p
          className="app-sidebar-title text-muted fw-bold text-uppercase mb-4 ms-2"
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

        <div className="d-flex flex-column gap-2">

          {/* MENU DÙNG CHUNG */}
          <NavLink to="/services" className={navClass}>
            <i className="bi bi-scissors me-2"></i>
            <span className="app-nav-label">Danh sách dịch vụ</span>
          </NavLink>

          {/* Đánh giá của tôi (Chỉ dành cho Customer) */}
          {isCustomer && (
            <NavLink to="/my-feedback" className={navClass}>
              <i className="bi bi-star-fill me-2"></i> <span className="app-nav-label">Đánh giá của tôi</span>
            </NavLink>
          )}

          {/* MENU LỊCH HẸN */}
          <NavLink to="/appointments" className={navClass}>
            <i className="bi bi-calendar-check-fill me-2"></i>
            <span className="app-nav-label">Danh sách lịch hẹn</span>
          </NavLink>

          {/* MENU ĐÁNH GIÁ
              Customer, Receptionist, Manager được xem */}
          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass}>
              <i className="bi bi-chat-quote-fill me-2"></i>
              <span className="app-nav-label">Đánh giá khách hàng</span>
            </NavLink>
          )}

          {/* MENU KHÁCH HÀNG
              Receptionist và Manager được xem */}
          {(isReceptionist || isManager) && (
            <NavLink to="/customers" className={navClass}>
              <i className="bi bi-people-fill me-2"></i>
              <span className="app-nav-label">Danh sách khách hàng</span>
            </NavLink>
          )}

          {/* MENU CHỈ DÀNH CHO MANAGER */}
          {isManager && (
            <>
              <NavLink to="/staffs" className={navClass}>
                <i className="bi bi-person-badge-fill me-2"></i>
                <span className="app-nav-label">Danh sách nhân viên</span>
              </NavLink>

              <NavLink to="/manager/products" className={navClass}>
                <i className="bi bi-box-seam me-2"></i>
                <span className="app-nav-label">Quản lý Sản phẩm</span>
              </NavLink>

              <NavLink to="/manager/suppliers" className={navClass}>
                <i className="bi bi-truck me-2"></i>
                <span className="app-nav-label">Quản lý Nhà cung cấp</span>
              </NavLink>

              <NavLink to="/manager/treatment-packages" className={navClass}>
                <i className="bi bi-box2-heart-fill me-2"></i>
                <span className="app-nav-label">Quản lý Gói liệu trình</span>
              </NavLink>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Sidebar;