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
    `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
      isActive ? "bg-primary text-white shadow" : "text-dark"
    }`;

  return (
    <div
      className="bg-white border-end shadow-sm"
      style={{ width: "fit-content", minWidth: "260px", minHeight: "100vh", zIndex: 10 }}
    >
      <div className="p-3 mt-2 text-start">
        <p className="text-muted fw-bold text-uppercase mb-4 ms-2" style={{ fontSize: "13px" }}>
          {isCustomer ? "Menu Khách hàng" : isTechnician ? "Menu Kỹ thuật viên" : isReceptionist ? "Menu Lễ tân" : "Quản lý hệ thống"}
        </p>

        <div className="d-flex flex-column gap-2">
            
          {/* MENU DÙNG CHUNG (Tất cả các Role đều thấy) */}
          <NavLink to="/services" className={navClass}>
            <i className="bi bi-scissors me-2"></i> Danh sách dịch vụ
          </NavLink>

          {/* MENU CỦA CUSTOMER, RECEPTIONIST, MANAGER (Kỹ thuật viên không xem đánh giá) */}
          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass}>
              <i className="bi bi-chat-quote-fill me-2"></i> Đánh giá khách hàng
            </NavLink>
          )}

          {/* MENU CỦA RECEPTIONIST VÀ MANAGER */}
          {(isReceptionist || isManager) && (
            <NavLink to="/customers" className={navClass}>
              <i className="bi bi-people-fill me-2"></i> Danh sách khách hàng
            </NavLink>
          )}

          {/* CÁC MENU ĐỘC QUYỀN CHỈ DÀNH CHO MANAGER */}
          {isManager && (
            <>
              <NavLink to="/staffs" className={navClass}>
                <i className="bi bi-person-badge-fill me-2"></i> Danh sách nhân viên
              </NavLink>
              
              <NavLink to="/manager/products" className={navClass}>
                <i className="bi bi-box-seam me-2"></i> Quản lý Sản phẩm
              </NavLink>
              
              <NavLink to="/manager/suppliers" className={navClass}>
                <i className="bi bi-truck me-2"></i> Quản lý Nhà cung cấp
              </NavLink>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Sidebar;