import { NavLink } from "react-router-dom";

const Sidebar = ({ user }) => {
  // Ẩn Sidebar nếu chưa đăng nhập hoặc có vai trò là Khách hàng (Customer)
  if (!user || user.role === "Customer") return null;

  return (
    <div className="bg-white border-end shadow-sm" style={{ width: "fit-content", minWidth: "260px", minHeight: "100vh", zIndex: 10 }}>
      <div className="p-3 mt-2 text-start">
        <p className="text-muted fw-bold text-uppercase mb-4 ms-2" style={{ fontSize: "13px" }}>
          Quản lý hệ thống
        </p>

        <div className="d-flex flex-column gap-2">
          {/* Menu Khách hàng */}
          <NavLink
            to="/customers"
            className={({ isActive }) =>
              `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
                isActive ? "bg-primary text-white shadow" : "text-dark"
              }`
            }
          >
            <i className="bi bi-people-fill me-2"></i> Danh sách khách hàng
          </NavLink>

          {/* Menu Nhân viên (Tạm thời dẫn tới /staffs) */}
          <NavLink
            to="/staffs"
            className={({ isActive }) =>
              `d-block px-3 py-2 rounded text-decoration-none fw-bold ${
                isActive ? "bg-primary text-white shadow-sm" : "text-dark"
              }`
            }
          >
            <i className="bi bi-person-badge-fill me-2"></i> Danh sách nhân viên
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;