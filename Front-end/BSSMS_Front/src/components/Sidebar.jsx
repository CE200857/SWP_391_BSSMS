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

          {/* Menu dịch vụ */}
          <NavLink
            to="/services"
            className={({ isActive }) =>
              `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
                isActive ? "bg-primary text-white shadow" : "text-dark"
              }`
            }
          >
            <i className="bi bi-scissors me-2"></i> Danh sách dịch vụ
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

<<<<<<< Updated upstream
          {/* Menu Xem đánh giá từ khách hàng (công khai nội bộ) */}
          <NavLink
            to="/feedback"
            className={({ isActive }) =>
              `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
                isActive ? "bg-primary text-white shadow" : "text-dark"
              }`
            }
          >
            <i className="bi bi-chat-quote-fill me-2"></i> Đánh giá khách hàng
          </NavLink>
=======
          {/* CUSTOMER, LỄ TÂN, QUẢN LÝ THẤY */}
          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass} title="Đánh giá khách hàng">
              <i className="bi bi-chat-quote-fill me-2"></i>
              {renderMenuLabel("Đánh giá khách hàng")}
            </NavLink>
          )}

          {/* LỄ TÂN, QUẢN LÝ THẤY */}
          {(isReceptionist || isManager) && (
            <NavLink to="/customers" className={navClass} title="Danh sách khách hàng">
              <i className="bi bi-people-fill me-2"></i>
              {renderMenuLabel("Danh sách khách hàng")}
            </NavLink>
          )}

          {/* CHỈ MANAGER MỚI ĐƯỢC THẤY */}
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

              <NavLink to="/treatment-packages" className={navClass} title="Quản lý Gói liệu trình">
                <i className="bi bi-box2-heart-fill me-2"></i>
                {renderMenuLabel("Quản lý Gói liệu trình")}
              </NavLink>

              <NavLink to="/manager/update-service-status" className={navClass} title="Cập nhật trạng thái dịch vụ">
                <i className="bi bi-toggle-on me-2"></i>
                {renderMenuLabel("Cập nhật trạng thái dịch vụ")}
              </NavLink>
            </>
          )}

          {/* KỸ THUẬT VIÊN + MANAGER THẤY */}
          {(isTechnician || isManager) && (
            <>
              <NavLink to="/treatment-status" className={navClass} title="Xem trạng thái điều trị">
                <i className="bi bi-clipboard-pulse me-2"></i>
                {renderMenuLabel("Trạng thái điều trị")}
              </NavLink>

              <NavLink to="/update-room-bed-status" className={navClass} title="Cập nhật trạng thái phòng & giường">
                <i className="bi bi-door-open me-2"></i>
                {renderMenuLabel("Cập nhật phòng & giường")}
              </NavLink>

              <NavLink to="/record-treatment-outcome" className={navClass} title="Ghi nhận kết quả điều trị">
                <i className="bi bi-clipboard-check me-2"></i>
                {renderMenuLabel("Ghi nhận kết quả điều trị")}
              </NavLink>
            </>
          )}

          {/* LỄ TÂN + MANAGER THẤY */}
          {(isReceptionist || isManager) && (
            <NavLink to="/sell-treatment-package" className={navClass} title="Bán gói liệu trình">
              <i className="bi bi-cart-plus me-2"></i>
              {renderMenuLabel("Bán gói liệu trình")}
            </NavLink>
          )}
          
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  );
};

export default Sidebar;