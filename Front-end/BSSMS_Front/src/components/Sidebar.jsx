import { useState } from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ user, collapsed = false, onToggle }) => {
  // Thêm State để điều khiển việc đóng/mở các menu con
  const [openTech, setOpenTech] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(false);

  // Ẩn Sidebar nếu chưa đăng nhập
  if (!user) return null;

  const role = user.role;
  const isCustomer = role === "Customer";
  const isTechnician = role === "Technician";
  const isReceptionist = role === "Receptionist";
  const isManager = role === "Manager";

  const navClass = ({ isActive }) =>
    `app-nav-link d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
      isActive ? "active bg-primary text-white shadow" : "text-dark"
    }`;

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
            {isCustomer ? "Menu Khách hàng" : isTechnician ? "Menu Kỹ thuật viên" : isReceptionist ? "Menu Lễ tân" : "Quản lý hệ thống"}
          </p>
          <button
            type="button"
            className="app-sidebar-toggle btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
            onClick={onToggle}
            title="Thu nhỏ/Mở rộng"
          >
            <i className="bi bi-list fs-4" />
          </button>
        </div>

        {/* DANH SÁCH MENU CHÍNH (Core Menus) */}
        <div className="d-flex flex-column gap-2">
          
          <NavLink to="/services" className={navClass}>
            <i className="bi bi-scissors fs-5"></i>{renderMenuLabel("Danh sách dịch vụ")}
          </NavLink>

          <NavLink to="/appointments" end className={navClass}>
            <i className="bi bi-calendar-check-fill fs-5"></i>{renderMenuLabel("Danh sách lịch hẹn")}
          </NavLink>

          {isCustomer && (
            <NavLink to="/my-feedback" className={navClass}>
              <i className="bi bi-star-fill fs-5"></i>{renderMenuLabel("Đánh giá của tôi")}
            </NavLink>
          )}

          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass}>
              <i className="bi bi-chat-quote-fill fs-5"></i>{renderMenuLabel("Đánh giá khách hàng")}
            </NavLink>
          )}

          {(isReceptionist || isManager) && (
            <>
              <NavLink to="/customers" className={navClass}>
                <i className="bi bi-people-fill fs-5"></i>{renderMenuLabel("Danh sách khách hàng")}
              </NavLink>
              <NavLink to="/sell-treatment-package" className={navClass}>
                <i className="bi bi-cart-plus fs-5"></i>{renderMenuLabel("Bán gói liệu trình")}
              </NavLink>
            </>
          )}

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
                  <NavLink to="/treatment-status" className={navClass}><i className="bi bi-clipboard-pulse fs-6"></i>{renderMenuLabel("Trạng thái điều trị")}</NavLink>
                  <NavLink to="/update-room-bed-status" className={navClass}><i className="bi bi-door-open fs-6"></i>{renderMenuLabel("Phòng & Giường")}</NavLink>
                  <NavLink to="/record-treatment-outcome" className={navClass}><i className="bi bi-clipboard-check fs-6"></i>{renderMenuLabel("Ghi nhận kết quả")}</NavLink>
                </div>
              )}
            </>
          )}

          {/* NHÓM 2: QUẢN LÝ NÂNG CAO (Chỉ Manager mới thấy) */}
          {isManager && (
            <>
              <div
                className="d-flex align-items-center px-3 py-3 rounded text-dark fw-bold mt-2 shadow-sm"
                style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}
                onClick={() => setOpenAdmin(!openAdmin)}
              >
                <i className="bi bi-briefcase fs-5"></i>
                {!collapsed && (
                  <>
                    <span className="ms-2">Quản lý nâng cao</span>
                    <i className={`bi bi-chevron-${openAdmin ? "up" : "down"} ms-auto`}></i>
                  </>
                )}
              </div>

              {/* Các menu con của Manager */}
              {openAdmin && !collapsed && (
                <div className="d-flex flex-column gap-2 ms-3 mt-1 border-start ps-2">
                  <NavLink to="/staffs" className={navClass}><i className="bi bi-person-badge-fill fs-6"></i>{renderMenuLabel("Nhân viên")}</NavLink>
                  <NavLink to="/manager/products" className={navClass}><i className="bi bi-box-seam fs-6"></i>{renderMenuLabel("Sản phẩm")}</NavLink>
                  <NavLink to="/manager/suppliers" className={navClass}><i className="bi bi-truck fs-6"></i>{renderMenuLabel("Nhà cung cấp")}</NavLink>
                  <NavLink to="/treatment-packages" className={navClass}><i className="bi bi-box2-heart-fill fs-6"></i>{renderMenuLabel("Gói liệu trình")}</NavLink>
                  <NavLink to="/manager/update-service-status" className={navClass}><i className="bi bi-toggle-on fs-6"></i>{renderMenuLabel("Trạng thái dịch vụ")}</NavLink>
                </div>
              )}
            </>
          )}
          
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;