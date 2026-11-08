// Đổi trạng thái lịch hẹn qua cùng một API cho mọi trang (lễ tân duyệt = chuyển sang Confirmed).
export async function setAppointmentStatus(appointmentId, status, notes = null) {
  const response = await fetch("/api/booking/checkin", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ appointmentId, status, notes }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Cập nhật trạng thái thất bại.");
  return data;
}
