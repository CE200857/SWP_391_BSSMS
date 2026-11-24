// Shared, presentation-only helpers for the invoice pages. No API calls here.
import { Badge } from "react-bootstrap";
import { label } from "../../../services/api";

export const statusBg = { Paid: "success", Unpaid: "warning", Refunded: "info", Cancelled: "secondary" };
export const needsRefund = (r) => r?.status === "Paid" && r?.invoiceType === "Appointment" && r?.appointmentStatus === "Cancelled";
export const displayStatus = (r) => (needsRefund(r) ? "RefundPending" : r?.status);
export const StatusBadge = ({ row, className }) => needsRefund(row)
  ? <Badge bg="danger" className={className}>Awaiting refund</Badge>
  : <Badge bg={statusBg[row.status]} className={className}>{label(row.status)}</Badge>;
