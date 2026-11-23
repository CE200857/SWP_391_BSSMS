export const APPOINTMENT_STATUS = {
  // Mỗi trạng thái một màu + một biểu tượng riêng (màu nằm ở manager-unify.css, lớp appt-status--<key>)
  Pending: { bg: "warning", text: "dark", label: "Pending", key: "pending", icon: "bi-hourglass-split" },
  Confirmed: { bg: "info", label: "Confirmed", key: "confirmed", icon: "bi-calendar-check" },
  "Checked-in": { bg: "primary", label: "Checked in", key: "checked-in", icon: "bi-door-open" },
  "In-progress": { bg: "primary", label: "In progress", key: "in-progress", icon: "bi-play-circle" },
  Completed: { bg: "success", label: "Completed", key: "completed", icon: "bi-check-circle-fill" },
  Cancelled: { bg: "danger", label: "Cancelled", key: "cancelled", icon: "bi-x-circle" },
  "No-show": { bg: "dark", label: "No-show", key: "no-show", icon: "bi-person-x" },
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
