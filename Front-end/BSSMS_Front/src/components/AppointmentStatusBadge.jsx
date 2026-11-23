import { appointmentStatusMeta } from "../utils/appointmentStatus";

// Nhãn trạng thái lịch hẹn: màu và biểu tượng riêng cho từng trạng thái
export default function AppointmentStatusBadge({ status }) {
  const meta = appointmentStatusMeta(status);
  return (
    <span className={`appt-status appt-status--${meta.key || "other"}`}>
      {meta.icon && <i className={`bi ${meta.icon}`} aria-hidden="true" />}
      {meta.label}
    </span>
  );
}
