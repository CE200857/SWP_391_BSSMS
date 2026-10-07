import { NavLink } from "react-router-dom";

const Sidebar = ({ user }) => {
  // Ẩn Sidebar nếu chưa đăng nhập
  if (!user) return null;

  const role = user.role;
  const isCustomer = role === "Customer";
  const isTechnician = role === "Technician";
  const isReceptionist = role === "Receptionist";
  const isManager = role === "Manager";

  // Tạo class dùng chung cho các nút bấm để code không bị lặp lại quá dài
  const navClass = ({ isActive }) =>
    `app-nav-link d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
      isActive ? "active" : ""
    }`;

  return (
    <div
      className="app-sidebar border-end shadow-sm"
      style={{ width: "fit-content", minWidth: "260px", minHeight: "100vh", zIndex: 10 }}
    >
      <div className="p-3 mt-2 text-start">
        <p className="app-sidebar-title text-muted fw-bold text-uppercase mb-4 ms-2" style={{ fontSize: "13px" }}>
          {isCustomer ? "Menu Khách hàng" : isTechnician ? "Menu Kỹ thuật viên" : isReceptionist ? "Menu Lễ tân" : "Quản lý hệ thống"}
        </p>

        <div className="d-flex flex-column gap-2">
            
          {/* MENU DÙNG CHUNG (Tất cả các Role đều thấy) */}
          <NavLink to="/services" className={navClass}>
            <i className="bi bi-scissors me-2"></i> <span className="app-nav-label">Danh sách dịch vụ</span>
          </NavLink>

          {/* MENU CỦA CUSTOMER, RECEPTIONIST, MANAGER (Kỹ thuật viên không xem đánh giá) */}
          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass}>
              <i className="bi bi-chat-quote-fill me-2"></i> <span className="app-nav-label">Đánh giá khách hàng</span>
            </NavLink>
          )}

          {/* MENU CỦA RECEPTIONIST VÀ MANAGER */}
          {(isReceptionist || isManager) && (
            <NavLink to="/customers" className={navClass}>
              <i className="bi bi-people-fill me-2"></i> <span className="app-nav-label">Danh sách khách hàng</span>
            </NavLink>
          )}

          {/* CÁC MENU ĐỘC QUYỀN CHỈ DÀNH CHO MANAGER */}
          {isManager && (
            <>
              <NavLink to="/staffs" className={navClass}>
                <i className="bi bi-person-badge-fill me-2"></i> <span className="app-nav-label">Danh sách nhân viên</span>
              </NavLink>
              
              <NavLink to="/manager/products" className={navClass}>
                <i className="bi bi-box-seam me-2"></i> <span className="app-nav-label">Quản lý Sản phẩm</span>
              </NavLink>

              {/* BỔ SUNG: QUẢN LÝ TỒN KHO */}
              <NavLink to="/manager/stock" className={navClass}>
                <i className="bi bi-boxes me-2"></i> <span className="app-nav-label">Quản lý Tồn kho</span>
              </NavLink>

              {/* BỔ SUNG: TẠO ĐƠN NHẬP HÀNG */}
              <NavLink to="/manager/purchase-orders" className={navClass}>
                <i className="bi bi-cart-plus-fill me-2"></i> <span className="app-nav-label">Tạo Đơn nhập hàng</span>
              </NavLink>
              
              <NavLink to="/manager/suppliers" className={navClass}>
                <i className="bi bi-truck me-2"></i> <span className="app-nav-label">Quản lý Nhà cung cấp</span>
              </NavLink>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Sidebar;