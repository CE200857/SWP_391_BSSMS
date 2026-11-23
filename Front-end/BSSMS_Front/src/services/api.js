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
      data?.message || `Could not complete the request (${response.status}).`,
    );
  return data;
}
export const post = (url, data) =>
  api(url, { method: "POST", body: JSON.stringify(data) });
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );
export const MIN_BIRTH_DATE = "1900-01-01";
// Date of birth must be between 01/01/1900 and today. Returns an error message, or null when empty/valid.
export const birthDateError = (value) => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Invalid date of birth!";
  if (value < MIN_BIRTH_DATE) return "Date of birth must be on or after 01/01/1900!";
  if (value > today()) return "Date of birth cannot be in the future!";
  return null;
};
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
  Waiting: "Waiting", InProgress: "In progress", Done: "Completed",
  Unpaid: "Unpaid", Paid: "Paid", Refunded: "Refunded",
  Cancelled: "Cancelled", Active: "Active", Inactive: "Inactive",
  Maintenance: "Maintenance", Free: "Free", InUse: "In use", Full: "Beds full",
  Expired: "Expired", Completed: "Done", Pending: "Pending approval",
  Approved: "Approved", Rejected: "Rejected", Locked: "Locked",
  Cash: "Cash", BankTransfer: "Bank transfer", VNPay: "VNPay",
  Counter: "At the counter", Online: "Online", Appointment: "Appointments", Package: "Treatment package",
  Facial: "Facial care", Massage: "Massage", HairWash: "Herbal hair wash", Body: "Body care",
  Percent: "Percent", Amount: "Amount",
  Morning: "Morning shift (08:30–13:30)", Afternoon: "Afternoon shift (13:30–18:30)", FullDay: "Full day (08:30–18:30)", Success: "Success", Failed: "Failed",
};
export const label = (value) => LABELS[value] || value || "—";
