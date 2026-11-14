import { Badge } from "react-bootstrap";
import { appointmentStatusMeta } from "../utils/appointmentStatus";

export default function AppointmentStatusBadge({ status }) {
  const meta = appointmentStatusMeta(status);
  return (
    <Badge bg={meta.bg} text={meta.text}>
      {meta.label}
    </Badge>
  );
}
