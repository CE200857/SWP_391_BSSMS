import { put } from "../services/api";

export function setAppointmentStatus(appointmentId, status, reason = null) {
  if (status === "Confirmed") return put(`/api/appointments/${appointmentId}/confirm`, {});
  if (status === "Cancelled") return put(`/api/appointments/${appointmentId}/cancel`, { reason });
  if (status === "No-show") return put(`/api/appointments/${appointmentId}/no-show`, {});
  return Promise.reject(new Error("Thao tác không được hỗ trợ."));
}
