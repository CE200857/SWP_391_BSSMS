import { Badge } from "react-bootstrap";
import { appointmentStatusMeta } from "../utils/appointmentStatus";

// Huy hiệu trạng thái lịch hẹn dùng chung cho mọi trang (nhãn và màu lấy từ utils/appointmentStatus.js).
export default function AppointmentStatusBadge({ status }) {
  const meta = appointmentStatusMeta(status);
  return (
    <Badge bg={meta.bg} text={meta.text}>
      {meta.label}
    </Badge>
  );
}
