import { NavLink } from "react-router-dom";

const Sidebar = ({ user }) => {
  // Ẩn Sidebar nếu chưa đăng nhập
  if (!user) return null;

  const isCustomer = user.role === "Customer";
  const isManager = user.role === "Manager";

  return (
    <div
      className="bg-white border-end shadow-sm"
      style={{ width: "fit-content", minWidth: "260px", minHeight: "100vh", zIndex: 10 }}
    >
      <div className="p-3 mt-2 text-start">
        <p className="text-muted fw-bold text-uppercase mb-4 ms-2" style={{ fontSize: "13px" }}>
          {isCustomer ? "Menu Khách hàng" : "Quản lý hệ thống"}
        </p>

        <div className="d-flex flex-column gap-2">
          {/* Menu Sản phẩm (Hiển thị cho tất cả người dùng) */}
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
                isActive ? "bg-primary text-white shadow" : "text-dark"
              }`
            }
          >
            <i className="bi bi-box-seam-fill me-2"></i>{" "}
            {isCustomer ? "Danh sách sản phẩm" : "Quản lý sản phẩm"}
          </NavLink>

          {/* Dành cho Staff / Manager */}
          {!isCustomer && (
            <>
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

              {/* Menu Dịch vụ */}
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

              {/* Menu Nhân viên (Chỉ Manager mới thấy) */}
              {isManager && (
                <NavLink
                  to="/staffs"
                  className={({ isActive }) =>
                    `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
                      isActive ? "bg-primary text-white shadow" : "text-dark"
                    }`
                  }
                >
                  <i className="bi bi-person-badge-fill me-2"></i> Danh sách nhân viên
                </NavLink>
              )}

              {/* Menu Xem đánh giá từ khách hàng */}
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
            </>
          )}

          {/* Dành riêng cho Customer */}
          {isCustomer && (
            <NavLink
              to="/my-feedback"
              className={({ isActive }) =>
                `d-flex align-items-center px-3 py-3 rounded text-decoration-none fw-bold ${
                  isActive ? "bg-primary text-white shadow" : "text-dark"
                }`
              }
            >
              <i className="bi bi-chat-left-text-fill me-2"></i> Đánh giá của tôi
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;