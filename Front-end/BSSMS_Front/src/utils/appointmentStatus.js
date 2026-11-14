export const APPOINTMENT_STATUS = {
  Pending: { bg: "warning", text: "dark", label: "Chờ xác nhận" },
  Confirmed: { bg: "success", label: "Đã xác nhận" },
  "Checked-in": { bg: "primary", label: "Đã check-in" },
  "In-progress": { bg: "primary", label: "Đang thực hiện" },
  Completed: { bg: "success", label: "Hoàn thành" },
  Cancelled: { bg: "danger", label: "Đã hủy" },
  "No-show": { bg: "dark", label: "Không đến" },
};

const ALIASES = {
  "Checked In": "Checked-in",
  "In Progress": "In-progress",
  "No Show": "No-show",
  Booked: "Pending",
  Scheduled: "Pending",
};

export function appointmentStatusMeta(status) {
  return APPOINTMENT_STATUS[ALIASES[status] || status] || { bg: "secondary", label: status || "—" };
}

export const appointmentStatusLabel = (status) => appointmentStatusMeta(status).label;
