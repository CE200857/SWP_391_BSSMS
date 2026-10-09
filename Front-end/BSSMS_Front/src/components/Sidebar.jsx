import { NavLink } from "react-router-dom";

const Sidebar = ({ user, collapsed = false, onToggle }) => {
  // Ẩn Sidebar nếu chưa đăng nhập
  if (!user) return null;

  const role = user.role;
  const isCustomer = role === "Customer";
  const isTechnician = role === "Technician";
  const isReceptionist = role === "Receptionist";
  const isManager = role === "Manager";

  // Kết hợp class "active" và màu sắc "bg-primary text-white shadow" của bạn
  const navClass = ({ isActive }) =>
    `app-nav-link d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
      isActive ? "active bg-primary text-white shadow" : "text-dark"
    }`;

  // Tách text ra thẻ riêng để dễ ẩn/hiện khi thu gọn
  const renderMenuLabel = (label) => (
    <span className="app-nav-label ms-2">{label}</span>
  );

  return (
    <aside
      className={`app-sidebar bg-white border-end shadow-sm ${collapsed ? "collapsed" : ""}`}
      style={{
        minHeight: "100vh",
        zIndex: 10,
      }}
    >
      <div className="app-sidebar-inner p-3 mt-2 text-start">
        
        {/* KHU VỰC TIÊU ĐỀ & NÚT THU GỌN */}
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

        {/* DANH SÁCH MENU */}
        <div className="d-flex flex-column gap-2">
          
          {/* AI CŨNG THẤY */}
          <NavLink to="/services" className={navClass} title="Danh sách dịch vụ">
            <i className="bi bi-scissors fs-5"></i>
            {renderMenuLabel("Danh sách dịch vụ")}
          </NavLink>

          <NavLink to="/appointments" className={navClass} title="Danh sách lịch hẹn">
            <i className="bi bi-calendar-check-fill fs-5"></i>
            {renderMenuLabel("Danh sách lịch hẹn")}
          </NavLink>

          {/* CHỈ CUSTOMER THẤY */}
          {isCustomer && (
            <NavLink to="/my-feedback" className={navClass} title="Đánh giá của tôi">
              <i className="bi bi-star-fill fs-5"></i>
              {renderMenuLabel("Đánh giá của tôi")}
            </NavLink>
          )}

          {/* CUSTOMER, LỄ TÂN, QUẢN LÝ THẤY */}
          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass} title="Đánh giá khách hàng">
              <i className="bi bi-chat-quote-fill fs-5"></i>
              {renderMenuLabel("Đánh giá khách hàng")}
            </NavLink>
          )}

          {/* LỄ TÂN, QUẢN LÝ THẤY */}
          {(isReceptionist || isManager) && (
            <>
              <NavLink to="/customers" className={navClass} title="Danh sách khách hàng">
                <i className="bi bi-people-fill fs-5"></i>
                {renderMenuLabel("Danh sách khách hàng")}
              </NavLink>
              
              <NavLink to="/sell-treatment-package" className={navClass} title="Bán gói liệu trình">
                <i className="bi bi-cart-plus fs-5"></i>
                {renderMenuLabel("Bán gói liệu trình")}
              </NavLink>
            </>
          )}

          {/* KỸ THUẬT VIÊN, QUẢN LÝ THẤY (Các menu mới thêm vào) */}
          {(isTechnician || isManager) && (
            <>
              <NavLink to="/treatment-status" className={navClass} title="Trạng thái điều trị">
                <i className="bi bi-clipboard-pulse fs-5"></i>
                {renderMenuLabel("Trạng thái điều trị")}
              </NavLink>

              <NavLink to="/update-room-bed-status" className={navClass} title="Cập nhật phòng & giường">
                <i className="bi bi-door-open fs-5"></i>
                {renderMenuLabel("Cập nhật phòng & giường")}
              </NavLink>

              <NavLink to="/record-treatment-outcome" className={navClass} title="Ghi nhận kết quả điều trị">
                <i className="bi bi-clipboard-check fs-5"></i>
                {renderMenuLabel("Ghi nhận kết quả")}
              </NavLink>
            </>
          )}

          {/* CHỈ MANAGER MỚI ĐƯỢC THẤY */}
          {isManager && (
            <>
              <NavLink to="/staffs" className={navClass} title="Danh sách nhân viên">
                <i className="bi bi-person-badge-fill fs-5"></i>
                {renderMenuLabel("Danh sách nhân viên")}
              </NavLink>

              <NavLink to="/manager/products" className={navClass} title="Quản lý Sản phẩm">
                <i className="bi bi-box-seam fs-5"></i>
                {renderMenuLabel("Quản lý Sản phẩm")}
              </NavLink>

              <NavLink to="/manager/suppliers" className={navClass} title="Quản lý Nhà cung cấp">
                <i className="bi bi-truck fs-5"></i>
                {renderMenuLabel("Quản lý Nhà cung cấp")}
              </NavLink>

              <NavLink to="/treatment-packages" className={navClass} title="Quản lý Gói liệu trình">
                <i className="bi bi-box2-heart-fill fs-5"></i>
                {renderMenuLabel("Quản lý Gói liệu trình")}
              </NavLink>

              <NavLink to="/manager/update-service-status" className={navClass} title="Cập nhật trạng thái dịch vụ">
                <i className="bi bi-toggle-on fs-5"></i>
                {renderMenuLabel("Cập nhật trạng thái dịch vụ")}
              </NavLink>
            </>
          )}
          
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;