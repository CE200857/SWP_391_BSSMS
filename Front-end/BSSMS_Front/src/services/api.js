export async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message || `Không thể thực hiện yêu cầu (${response.status}).`,
    );
  return data;
}
export const post = (url, data) =>
  api(url, { method: "POST", body: JSON.stringify(data) });
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );
export const money = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value || 0),
  );
export const put = (url, data = {}) =>
  api(url, { method: "PUT", body: JSON.stringify(data) });
export const del = (url) => api(url, { method: "DELETE" });
export const time5 = (value) => (value ? String(value).slice(0, 5) : "—");
export const day10 = (value) => (value ? String(value).slice(0, 10) : "—");
export const viDate = (value) => {
  if (!value) return "—";
  const [y, m, d] = String(value).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
export const addDays = (iso, n) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const LABELS = {
  Waiting: "Chờ thực hiện", InProgress: "Đang làm", Done: "Hoàn thành",
  Unpaid: "Chưa thanh toán", Paid: "Đã thanh toán", Refunded: "Đã hoàn tiền",
  Cancelled: "Đã hủy", Active: "Hoạt động", Inactive: "Ngừng hoạt động",
  Maintenance: "Bảo trì", Free: "Trống", InUse: "Đang dùng", Full: "Kín giường",
  Expired: "Hết hạn", Completed: "Hoàn tất", Pending: "Chờ duyệt",
  Approved: "Đã duyệt", Rejected: "Từ chối", Locked: "Bị khóa",
  Cash: "Tiền mặt", BankTransfer: "Chuyển khoản", VNPay: "VNPay",
  Counter: "Tại quầy", Online: "Trực tuyến", Appointment: "Lịch hẹn", Package: "Gói liệu trình",
  Facial: "Chăm sóc da mặt", Massage: "Massage", HairWash: "Gội đầu dưỡng sinh", Body: "Chăm sóc body",
  Percent: "Phần trăm", Amount: "Số tiền",
  Morning: "Ca sáng (08:30–13:30)", Afternoon: "Ca chiều (13:30–18:30)", FullDay: "Cả ngày (08:30–18:30)", Success: "Thành công", Failed: "Thất bại",
};
export const label = (value) => LABELS[value] || value || "—";
