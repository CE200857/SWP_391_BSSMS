import { managerGroups, managerSection } from "./managerNavigation";

export const staffNavigation = {
  Manager: {
    label: "Quản lý hệ thống",
    home: "/manager/dashboard",
    homeLabel: "Tổng quan & báo cáo",
    groups: managerGroups,
  },
  Receptionist: {
    label: "Lễ tân",
    home: "/receptionist/dashboard",
    homeLabel: "Tổng quan lễ tân",
    groups: [
      [
        "booking",
        "Lịch hẹn & đón khách",
        "calendar2-week",
        [
          ["/appointments", "Danh sách lịch hẹn"],
          ["/appointments/create", "Đặt lịch tại quầy"],
          ["/slots", "Tra cứu lịch trống"],
          ["/receptionist/coordination", "Check-in & điều phối"],
        ],
      ],
      [
        "customers",
        "Khách hàng & ưu đãi",
        "people",
        [
          ["/customers", "Danh sách khách hàng"],
          ["/receptionist/create-walkin", "Thêm khách tại quầy"],
          ["/membership-benefits", "Quyền lợi thành viên"],
          ["/vouchers", "Voucher"],
          ["/feedback", "Đánh giá khách hàng"],
        ],
      ],
      [
        "catalog",
        "Dịch vụ & liệu trình",
        "scissors",
        [
          ["/services", "Danh sách dịch vụ"],
          ["/treatment-packages", "Gói liệu trình"],
          ["/service-history", "Lịch sử dịch vụ"],
          ["/my-treatment-profile", "Hồ sơ liệu trình"],
          ["/treatment-status", "Trạng thái điều trị"],
        ],
      ],
      [
        "finance",
        "Bán hàng & thanh toán",
        "receipt",
        [
          ["/invoices", "Hóa đơn & thanh toán"],
          ["/invoices/create", "Tạo hóa đơn"],
          ["/products", "Bán lẻ sản phẩm"],
          ["/sell-treatment-package", "Bán gói liệu trình"],
        ],
      ],
    ],
  },
  Technician: {
    label: "Kỹ thuật viên",
    home: "/technician/dashboard",
    homeLabel: "Công việc hôm nay",
    groups: [
      [
        "treatment",
        "Lịch hẹn & điều trị",
        "clipboard-pulse",
        [
          ["/appointments", "Lịch hẹn được giao"],
          ["/treatment-status", "Trạng thái điều trị"],
          ["/record-treatment-outcome", "Ghi nhận kết quả"],
          ["/my-treatment-profile", "Hồ sơ liệu trình"],
          ["/service-history", "Lịch sử dịch vụ"],
        ],
      ],
      [
        "resources",
        "Phòng & giường",
        "building",
        [["/update-room-bed-status", "Trạng thái phòng & giường"]],
      ],
      [
        "catalog",
        "Dịch vụ & liệu trình",
        "scissors",
        [
          ["/services", "Danh sách dịch vụ"],
          ["/treatment-packages", "Gói liệu trình"],
        ],
      ],
      [
        "commission",
        "Hoa hồng cá nhân",
        "cash-coin",
        [["/technician/commission", "Theo dõi hoa hồng"]],
      ],
    ],
  },
};

export function staffSection(role, pathname) {
  if (role === "Manager") return managerSection(pathname);
  const path = pathname.startsWith("/treatment-profile/")
    ? "/my-treatment-profile"
    : pathname;
  return (staffNavigation[role]?.groups || [])
    .flatMap((group) => group[3].map((link) => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + "/"))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
