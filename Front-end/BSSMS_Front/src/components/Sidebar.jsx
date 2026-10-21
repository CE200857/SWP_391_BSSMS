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
    `app-nav-link d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
      isActive ? "active" : ""
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

<<<<<<< Updated upstream
          {/* MENU CHỈ DÀNH CHO MANAGER */}
=======
          {/* NHÓM 1: NGHIỆP VỤ KỸ THUẬT (Dành cho Technician & Manager) */}
          {(isTechnician || isManager) && (
            <>
              <div
                className="d-flex align-items-center px-3 py-3 rounded text-dark fw-bold mt-2 shadow-sm"
                style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}
                onClick={() => setOpenTech(!openTech)}
              >
                <i className="bi bi-heart-pulse fs-5"></i>
                {!collapsed && (
                  <>
                    <span className="ms-2">Nghiệp vụ KTV</span>
                    <i className={`bi bi-chevron-${openTech ? "up" : "down"} ms-auto`}></i>
                  </>
                )}
              </div>

              {/* Các menu con sẽ sổ xuống khi bấm vào nút trên */}
              {openTech && !collapsed && (
                <div className="d-flex flex-column gap-2 ms-3 mt-1 border-start ps-2">
                  <NavLink to="/treatment-status" className={navClass}>
                    <i className="bi bi-clipboard-pulse fs-6"></i>
                    {renderMenuLabel("Trạng thái điều trị")}
                  </NavLink>
                  <NavLink to="/update-room-bed-status" className={navClass}>
                    <i className="bi bi-door-open fs-6"></i>
                    {renderMenuLabel("Phòng & Giường")}
                  </NavLink>
                  <NavLink to="/record-treatment-outcome" className={navClass}>
                    <i className="bi bi-clipboard-check fs-6"></i>
                    {renderMenuLabel("Ghi nhận kết quả")}
                  </NavLink>
                  <NavLink to="/my-treatment-profile" className={navClass}>
                    <i className="bi bi-clipboard-data fs-6"></i>
                    {renderMenuLabel("Hồ sơ liệu trình")}
                  </NavLink>
                  {isTechnician && (
                    <NavLink to="/technician/commission" className={navClass}>
                      <i className="bi bi-cash-coin fs-6"></i>
                      {renderMenuLabel("Hoa hồng cá nhân")}
                    </NavLink>
                  )}
                </div>
              )}
            </>
          )}

          {/* NHÓM 2: QUẢN LÝ NÂNG CAO (Chỉ Manager mới thấy) */}
>>>>>>> Stashed changes
          {isManager && (
            <>
              <NavLink to="/staffs" className={navClass}>
                <i className="bi bi-person-badge-fill me-2"></i>
                <span className="app-nav-label">Danh sách nhân viên</span>
              </NavLink>

<<<<<<< Updated upstream
              <NavLink to="/manager/products" className={navClass}>
                <i className="bi bi-box-seam me-2"></i>
                <span className="app-nav-label">Quản lý Sản phẩm</span>
              </NavLink>

            
=======
              {/* Các menu con của Manager */}
              {openAdmin && !collapsed && (
                <div className="d-flex flex-column gap-2 ms-3 mt-1 border-start ps-2">
                  <NavLink to="/staffs" className={navClass}>
                    <i className="bi bi-person-badge-fill fs-6"></i>
                    {renderMenuLabel("Nhân viên")}
                  </NavLink>
                  <NavLink to="/manager/products" className={navClass}>
                    <i className="bi bi-box-seam fs-6"></i>
                    {renderMenuLabel("Sản phẩm")}
                  </NavLink>
                  <NavLink to="/manager/suppliers" className={navClass}>
                    <i className="bi bi-truck fs-6"></i>
                    {renderMenuLabel("Nhà cung cấp")}
                  </NavLink>
                  <NavLink to="/treatment-packages" className={navClass}>
                    <i className="bi bi-box2-heart-fill fs-6"></i>
                    {renderMenuLabel("Gói liệu trình")}
                  </NavLink>
                  <NavLink to="/manager/update-service-status" className={navClass}>
                    <i className="bi bi-toggle-on fs-6"></i>
                    {renderMenuLabel("Trạng thái dịch vụ")}
                  </NavLink>
                  <NavLink to="/manager/resources" className={navClass}>
                    <i className="bi bi-building"></i>
                    {renderMenuLabel("Quản lý Tài nguyên")}
                  </NavLink>
                  <NavLink to="/birthday-promotions" className={navClass}>
                    <i className="bi bi-calendar-heart fs-6"></i>
                    {renderMenuLabel("KM Sinh nhật")}
                  </NavLink>
                  <NavLink to="/my-treatment-profile" className={navClass}>
                    <i className="bi bi-clipboard-pulse fs-6"></i>
                    {renderMenuLabel("Hồ sơ liệu trình")}
                  </NavLink>
                  <NavLink to="/manager/commission/report" className={navClass}>
                    <i className="bi bi-graph-up-arrow fs-6"></i>
                    {renderMenuLabel("Báo cáo hoa hồng")}
                  </NavLink>
                </div>
              )}
>>>>>>> Stashed changes
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Sidebar;