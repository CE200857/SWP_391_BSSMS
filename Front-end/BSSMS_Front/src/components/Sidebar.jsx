import { NavLink } from "react-router-dom";

const Sidebar = ({ user, collapsed = false, onToggle }) => {
  if (!user) return null;

  const role = user.role;

  const isCustomer = role === "Customer";
  const isTechnician = role === "Technician";
  const isReceptionist = role === "Receptionist";
  const isManager = role === "Manager";

  // CHÚ Ý: Đã thêm lại "px-3 py-3" của bạn để ô màu hồng bọc icon và chữ thật đẹp
  const navClass = ({ isActive }) =>
    `app-nav-link d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
      isActive ? "active" : ""
    }`;

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
        
        {/* KHU VỰC TIÊU ĐỀ & NÚT THU GỌN CỦA KHÁNH */}
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

        {/* DANH SÁCH MENU (Đã chỉnh lại vị trí để không bị mất chức năng) */}
        <div className="d-flex flex-column gap-2">
          
          {/* AI CŨNG THẤY */}
          <NavLink to="/services" className={navClass} title="Danh sách dịch vụ">
            <i className="bi bi-scissors me-2"></i>
            {renderMenuLabel("Danh sách dịch vụ")}
          </NavLink>

          <NavLink to="/appointments" className={navClass} title="Danh sách lịch hẹn">
            <i className="bi bi-calendar-check-fill me-2"></i>
            {renderMenuLabel("Danh sách lịch hẹn")}
          </NavLink>

          {/* CHỈ CUSTOMER THẤY */}
          {isCustomer && (
            <NavLink to="/my-feedback" className={navClass} title="Đánh giá của tôi">
              <i className="bi bi-star-fill me-2"></i>
              {renderMenuLabel("Đánh giá của tôi")}
            </NavLink>
          )}

<<<<<<< Updated upstream
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
=======
          {isCustomer && (
            <NavLink to="/my-feedback" className={navClass}>
              <i className="bi bi-star-fill fs-5"></i>{renderMenuLabel("Đánh giá của tôi")}
            </NavLink>
          )}

          {isCustomer && (
            <NavLink to="/my-treatment-profile" className={navClass}>
              <i className="bi bi-clipboard-pulse fs-5"></i>{renderMenuLabel("Hồ sơ liệu trình của tôi")}
            </NavLink>
          )}

          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass}>
              <i className="bi bi-chat-quote-fill fs-5"></i>{renderMenuLabel("Đánh giá khách hàng")}
            </NavLink>
          )}

          {/* Check-in & Status Update + Coordinate Service: Chỉ dành cho Receptionist */}
          {isReceptionist && (
            <NavLink to="/receptionist/coordination" className={navClass}>
              <i className="bi bi-sliders fs-5"></i>{renderMenuLabel("Check-in & Điều phối")}
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
              <NavLink to="/vouchers" className={navClass}>
                <i className="bi bi-ticket-perforated fs-5"></i>{renderMenuLabel("Quản lý Voucher")}
              </NavLink>
            </>
          )}

          {isReceptionist && (
            <NavLink to="/invoices/create" className={navClass}>
              <i className="bi bi-receipt-cutoff fs-5"></i>
              {renderMenuLabel("Tạo hóa đơn")}
>>>>>>> Stashed changes
            </NavLink>
          )}

          {/* CUSTOMER, LỄ TÂN, QUẢN LÝ THẤY */}
          {(isCustomer || isReceptionist || isManager) && (
            <NavLink to="/feedback" className={navClass} title="Đánh giá khách hàng">
              <i className="bi bi-chat-quote-fill me-2"></i>
              {renderMenuLabel("Đánh giá khách hàng")}
            </NavLink>
          )}

<<<<<<< Updated upstream
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
=======
              {/* Các menu con sẽ sổ xuống khi bấm vào nút trên */}
              {openTech && !collapsed && (
                <div className="d-flex flex-column gap-2 ms-3 mt-1 border-start ps-2">
                  <NavLink to="/treatment-status" className={navClass}><i className="bi bi-clipboard-pulse fs-6"></i>{renderMenuLabel("Trạng thái điều trị")}</NavLink>
                  <NavLink to="/update-room-bed-status" className={navClass}><i className="bi bi-door-open fs-6"></i>{renderMenuLabel("Phòng & Giường")}</NavLink>
                  <NavLink to="/record-treatment-outcome" className={navClass}><i className="bi bi-clipboard-check fs-6"></i>{renderMenuLabel("Ghi nhận kết quả")}</NavLink>
                  <NavLink to="/my-treatment-profile" className={navClass}><i className="bi bi-clipboard-data fs-6"></i>{renderMenuLabel("Hồ sơ liệu trình")}</NavLink>
                </div>
              )}
>>>>>>> Stashed changes
            </>
          )}

          {/* --- 5 CHỨC NĂNG MỚI --- */}

<<<<<<< Updated upstream
          {/* 1. View Treatment Status - Tất cả role */}
          <NavLink to="/treatment-status" className={navClass} title="Xem trạng thái điều trị">
            <i className="bi bi-activity me-2"></i>
            {renderMenuLabel("Xem trạng thái điều trị")}
          </NavLink>

          {/* 2. Update Service Status - Chỉ Manager */}
          {isManager && (
            <NavLink to="/manager/update-service-status" className={navClass} title="Cập nhật trạng thái dịch vụ">
              <i className="bi bi-toggle-on me-2"></i>
              {renderMenuLabel("Cập nhật TT dịch vụ")}
            </NavLink>
          )}

          {/* 3. Update Room & Bed Status - Manager, Receptionist, Technician */}
          {(isManager || isReceptionist || isTechnician) && (
            <NavLink to="/update-room-bed-status" className={navClass} title="Cập nhật trạng thái phòng & giường">
              <i className="bi bi-door-open me-2"></i>
              {renderMenuLabel("Cập nhật TT phòng/giường")}
            </NavLink>
          )}

          {/* 4. Record Treatment Outcomes - Manager, Technician */}
          {(isManager || isTechnician) && (
            <NavLink to="/record-treatment-outcome" className={navClass} title="Ghi nhận kết quả điều trị">
              <i className="bi bi-clipboard-check me-2"></i>
              {renderMenuLabel("Ghi nhận kết quả điều trị")}
            </NavLink>
          )}

          {/* 5. Sell Treatment Package - Manager, Receptionist */}
          {(isManager || isReceptionist) && (
            <NavLink to="/sell-treatment-package" className={navClass} title="Bán gói liệu trình">
              <i className="bi bi-cart-plus me-2"></i>
              {renderMenuLabel("Bán gói liệu trình")}
            </NavLink>
=======
              {/* Các menu con của Manager */}
              {openAdmin && !collapsed && (
                <div className="d-flex flex-column gap-2 ms-3 mt-1 border-start ps-2">
                  <NavLink to="/staffs" className={navClass}><i className="bi bi-person-badge-fill fs-6"></i>{renderMenuLabel("Nhân viên")}</NavLink>
                  <NavLink to="/manager/products" className={navClass}><i className="bi bi-box-seam fs-6"></i>{renderMenuLabel("Sản phẩm")}</NavLink>
                  <NavLink to="/manager/suppliers" className={navClass}><i className="bi bi-truck fs-6"></i>{renderMenuLabel("Nhà cung cấp")}</NavLink>
                  <NavLink to="/treatment-packages" className={navClass}><i className="bi bi-box2-heart-fill fs-6"></i>{renderMenuLabel("Gói liệu trình")}</NavLink>
                  <NavLink to="/manager/update-service-status" className={navClass}><i className="bi bi-toggle-on fs-6"></i>{renderMenuLabel("Trạng thái dịch vụ")}</NavLink>
                  <NavLink to="/manager/resources" className={navClass}><i className="bi bi-building"></i>{renderMenuLabel("Quản lý Tài nguyên")}</NavLink>
                  <NavLink to="/birthday-promotions" className={navClass}><i className="bi bi-calendar-heart fs-6"></i>{renderMenuLabel("KM Sinh nhật")}</NavLink>
                  <NavLink to="/my-treatment-profile" className={navClass}><i className="bi bi-clipboard-pulse fs-6"></i>{renderMenuLabel("Hồ sơ liệu trình")}</NavLink>
                </div>
              )}
            </>
>>>>>>> Stashed changes
          )}

        </div>
      </div>
    </aside>
  );
};

export default Sidebar;