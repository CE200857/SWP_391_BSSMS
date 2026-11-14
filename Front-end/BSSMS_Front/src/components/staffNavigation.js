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
          ["/slots", "Tra cứu lịch trống"],
          ["/receptionist/coordination", "Check-in & điều phối"],
          ["/treatment-status", "Trạng thái dịch vụ"],
          ["/room-bed-board", "Trạng thái phòng & giường"],
        ],
      ],
      [
        "customers",
        "Khách hàng & ưu đãi",
        "people",
        [
          ["/customers", "Danh sách khách hàng"],
          ["/my-treatment-profile", "Hồ sơ & liệu trình khách"],
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
        ],
      ],
      [
        "finance",
        "Thu ngân",
        "receipt",
        [
          ["/invoices/create", "Thu tiền lịch hẹn"],
          ["/sell-treatment-package", "Bán gói liệu trình"],
          ["/invoices", "Hóa đơn"],
        ],
      ],
      [
        "schedule",
        "Lịch làm việc",
        "clock-history",
        [["/my-schedule", "Ca làm & nghỉ phép"]],
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
          ["/treatment-status", "Dịch vụ được giao"],
          ["/record-treatment-outcome", "Ghi nhận kết quả"],
          ["/appointments", "Lịch hẹn được giao"],
          ["/my-treatment-profile", "Hồ sơ khách hàng"],
          ["/service-history", "Lịch sử dịch vụ"],
        ],
      ],
      [
        "resources",
        "Phòng & giường",
        "building",
        [["/room-bed-board", "Trạng thái phòng & giường"]],
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
        "schedule",
        "Lịch làm việc",
        "clock-history",
        [["/my-schedule", "Ca làm & nghỉ phép"]],
      ],
    ],
  },
};

export function staffSection(role, pathname) {
  if (role === "Manager") return managerSection(pathname);
  const path = pathname === "/receptionist/create-walkin"
    ? "/customers"
    : pathname === "/update-room-bed-status"
    ? "/room-bed-board"
    : pathname === "/appointments/create"
    ? "/appointments"
    : pathname.startsWith("/treatment-profile/")
    ? "/my-treatment-profile"
    : pathname;
  return (staffNavigation[role]?.groups || [])
    .flatMap((group) => group[3].map((link) => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + "/"))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
