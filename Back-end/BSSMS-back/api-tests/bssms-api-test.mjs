#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = (process.env.BSSMS_API || "http://localhost:8080/BSSMS-back").replace(/\/$/, "");
const PASSWORD = "123456";
const RUN = Date.now().toString(36).slice(-5);

const vnNow = () => new Date(Date.now() + 7 * 3600 * 1000);
const iso = (d) => d.toISOString().slice(0, 10);
const day = (k) => { const d = vnNow(); d.setUTCDate(d.getUTCDate() + k); return iso(d); };
const nowMinutes = () => { const d = vnNow(); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
const TODAY = day(0);

class Client {
  constructor(name) { this.name = name; this.cookie = ""; }
  async call(method, path, body) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.cookie) headers.Cookie = this.cookie;
    let res;
    try {
      res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    } catch (e) {
      return { status: 0, ok: false, data: null, text: `Không kết nối được ${BASE}: ${e.cause?.code || e.message}`, method, path };
    }
    const setCookie = res.headers.getSetCookie?.() || [];
    for (const c of setCookie) {
      const pair = c.split(";")[0];
      if (pair.startsWith("JSESSIONID=")) this.cookie = pair;
    }
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {  }
    return { status: res.status, ok: res.status >= 200 && res.status < 300, data, text, method, path };
  }
  get(p) { return this.call("GET", p); }
  post(p, b = {}) { return this.call("POST", p, b); }
  put(p, b = {}) { return this.call("PUT", p, b); }
  del(p) { return this.call("DELETE", p); }
}

const results = [];
class Skip extends Error {}
class Fail extends Error { constructor(msg, res) { super(msg); this.res = res; } }
const need = (value, what) => { if (value === undefined || value === null) throw new Skip(`thiếu dữ liệu từ bước trước: ${what}`); return value; };
const short = (s, n = 300) => (s && s.length > n ? s.slice(0, n) + "…" : s || "");
const msgOf = (res) => res?.data?.message || res?.data?.error || short(res?.text);

function ok(res, what = "") {
  if (!res.ok) throw new Fail(`${what ? what + ": " : ""}mong đợi 2xx, nhận ${res.status} – ${msgOf(res)}`, res);
  return res.data;
}
function status(res, expected, what = "") {
  const list = Array.isArray(expected) ? expected : [expected];
  if (!list.includes(res.status)) throw new Fail(`${what ? what + ": " : ""}mong đợi HTTP ${list.join("/")}, nhận ${res.status} – ${msgOf(res)}`, res);
  return res.data;
}
function check(cond, message) { if (!cond) throw new Fail(message); }
function eq(actual, expected, what) {
  if (Number(actual) !== Number(expected) && String(actual) !== String(expected))
    throw new Fail(`${what}: mong đợi ${expected}, nhận ${actual}`);
}

let current = "";
function section(name) { current = name; console.log(`\n=== ${name} ===`); }
async function test(uc, name, fn) {
  const started = Date.now();
  try {
    const out = await fn();
    const note = typeof out === "string" || typeof out === "number" ? String(out) : "";
    results.push({ section: current, uc, name, result: "PASS", note: note || "", ms: Date.now() - started });
    console.log(`  \x1b[32mPASS\x1b[0m ${uc} ${name}${note ? " – " + note : ""}`);
  } catch (e) {
    if (e instanceof Skip) {
      results.push({ section: current, uc, name, result: "SKIP", note: e.message });
      console.log(`  \x1b[33mSKIP\x1b[0m ${uc} ${name} – ${e.message}`);
    } else {
      const res = e.res;
      results.push({ section: current, uc, name, result: "FAIL", note: e.message,
        call: res ? `${res.method} ${res.path} → ${res.status}` : "", body: res ? short(res.text, 600) : (e instanceof Fail ? "" : e.stack) });
      console.log(`  \x1b[31mFAIL\x1b[0m ${uc} ${name} – ${e.message}`);
    }
  }
}

const ACC = {
  manager: "lan.manager@bssms.vn", receptionist: "ha.reception@bssms.vn",
  mai: "mai.tech@bssms.vn", huong: "huong.tech@bssms.vn", truc: "truc.tech@bssms.vn", ngoc: "ngoc.tech@bssms.vn", quy: "quy.tech@bssms.vn",
  hoa: "hoa.nguyen@gmail.com", minhanh: "minhanh.tran@gmail.com", bao: "bao.le@gmail.com", yen: "yen.ngo@gmail.com", diep: "diep.vu@gmail.com",
};
const TECH_EMAIL = { 4: ACC.mai, 5: ACC.huong, 6: ACC.truc, 7: ACC.ngoc, 8: ACC.quy };
const SESSIONS = {};
const C = new Proxy(SESSIONS, {
  get(target, key) {
    if (typeof key !== "string") return undefined;
    if (!(key in target)) throw new Skip(`chưa đăng nhập được tài khoản ${key}`);
    return target[key];
  },
  set(target, key, value) { target[key] = value; return true; },
});
const ctx = {};

const firstAvailable = (slots, { minStart = "00:00", maxEnd = "23:59" } = {}) =>
  (slots || []).find((s) => s.available && s.startTime >= minStart && s.endTime <= maxEnd);
const lineIds = (detail) => (detail?.services || []).map((l) => l.appointmentServiceId);
async function detail(client, id) { return ok(await client.get(`/api/appointments/${id}`), "xem chi tiết lịch"); }
function assignmentsFromPlan(plan) {
  const byPart = {};
  return (plan.lines || []).map((l) => {
    const tech = byPart[l.part] ?? l.technicianId ?? l.suggestedTechnicianId ?? l.technicianOptions?.[0]?.staffId ?? null;
    byPart[l.part] = tech;
    const bed = l.bedId ?? l.suggestedBedId ?? l.bedOptions?.[0]?.bedId ?? null;
    return { appointmentServiceId: l.appointmentServiceId, technicianId: tech, bedId: bed };
  });
}

async function main() {
  console.log(`BSSMS API test – ${BASE} – hôm nay ${TODAY} (giờ VN)`);

  section("0. Kết nối & đăng nhập (UC-1)");
  await test("UC-1", "Máy chủ phản hồi", async () => {
    const r = await new Client("probe").get("/api/service");
    if (r.status === 0) { ctx.offline = r.text; throw new Fail(r.text, r); }
    ok(r, "GET /api/service (công khai)");
  });
  if (ctx.offline) {
    console.log(`\n\x1b[31m${ctx.offline}\x1b[0m\nHãy bật Tomcat (back-end) rồi chạy lại. Có thể đổi địa chỉ bằng biến BSSMS_API.`);
    return;
  }
  for (const [key, email] of Object.entries(ACC)) {
    await test("UC-1", `Đăng nhập ${key} (${email})`, async () => {
      const c = new Client(key);
      const d = ok(await c.post("/api/login", { email, password: PASSWORD }));
      check(c.cookie, "không nhận được cookie JSESSIONID");
      C[key] = c;
      return d?.role;
    });
  }
  await test("UC-1", "Sai mật khẩu bị từ chối", async () => {
    status(await new Client("x").post("/api/login", { email: ACC.bao, password: "sai-mat-khau" }), [400, 401, 403]);
  });

  await test("SETUP", "Dữ liệu mẫu vừa được nạp lại (02_Insert_Data.sql)", async () => {
    const list = ok(await C.manager.get("/api/appointments"));
    const byId = Object.fromEntries(list.map((a) => [a.appointmentId, a.status]));
    const extra = list.filter((a) => a.appointmentId > 16).length;
    const problems = [];
    if (extra) problems.push(`có ${extra} lịch hẹn ngoài dữ liệu mẫu`);
    if (byId[9] !== "Confirmed") problems.push(`lịch #9 đang là ${byId[9]} (mẫu: Confirmed)`);
    if (byId[12] !== "Pending") problems.push(`lịch #12 đang là ${byId[12]} (mẫu: Pending)`);
    if (problems.length) { ctx.dirty = problems.join("; "); throw new Fail(ctx.dirty); }
  });
  if (ctx.dirty) {
    console.log(`\n\x1b[31mDữ liệu chưa được nạp lại: ${ctx.dirty}.\x1b[0m\nHãy chạy 00_Delete_Data.sql rồi 02_Insert_Data.sql trong SSMS, sau đó chạy lại script. Đã dừng test.`);
    return;
  }

  section("1. Phân quyền");
  await test("SEC", "Chưa đăng nhập không xem được lịch hẹn", async () => status(await new Client("anon").get("/api/appointments"), [401, 403]));
  await test("SEC", "Khách không xem được danh sách nhân viên", async () => status(await C.bao.get("/api/staff"), 403));
  await test("SEC", "KTV không tạo được voucher", async () =>
    status(await C.huong.post("/api/vouchers", { action: "create", voucherCode: "X" + RUN }), 403));
  await test("SEC", "Lễ tân không xem được dashboard", async () => status(await C.receptionist.get("/api/dashboard-reports"), 403));
  await test("SEC", "Khách không xem được hóa đơn của khách khác", async () =>
    status(await C.bao.get("/api/invoices/1"), [403, 404]));

  section("2. Mở các màn hình danh sách (không được lỗi 500)");
  const smoke = {
    hoa: ["/api/profile", "/api/service", "/api/treatment-packages", "/api/appointments", "/api/invoices", "/api/booking/my-packages",
      "/api/customer-packages", "/api/membership-tiers", "/api/membership-tiers?mine=1", "/api/service-history", "/api/feedback",
      "/api/feedback/appointments/1"],
    receptionist: ["/api/profile", "/api/appointments", `/api/booking/coordination?date=${TODAY}`, "/api/booking/affected", "/api/invoices",
      "/api/invoices/unpaid-appointments", "/api/customers", "/api/vouchers", "/api/room-bed-status", `/api/treatment-status?fromDate=${TODAY}&toDate=${TODAY}`,
      `/api/operations/my-schedule?date=${TODAY}`, "/api/treatment-profiles", "/api/membership-tiers", "/api/rooms", "/api/beds", "/api/service-history",
      `/api/booking/my-packages?customerId=1`, "/api/customer-packages/1"],
    huong: ["/api/profile", "/api/treatment-status", "/api/appointments", `/api/operations/my-schedule?date=${TODAY}`,
      "/api/room-bed-status", "/api/treatment-profiles", "/api/service-history"],
    manager: ["/api/profile", `/api/dashboard-reports?fromDate=${day(-7)}&toDate=${TODAY}`, "/api/staff", "/api/rooms", "/api/beds",
      `/api/operations/scheduling?date=${TODAY}`, "/api/operations/leaves", `/api/operations/tour-report?date=${TODAY}`, "/api/vouchers",
      "/api/treatment-packages", "/api/membership-tiers", "/api/invoices", "/api/feedback", "/api/feedback/moderation", "/api/customers",
      "/api/appointments", "/api/treatment-profiles", "/api/room-bed-status", `/api/service?technicians=1`],
  };
  for (const [who, paths] of Object.entries(smoke))
    for (const p of paths)
      await test("SMOKE", `${who}: GET ${p}`, async () => { ok(await C[who].get(p)); });

  section("3. Đặt lịch online – khách bao.le (UC-11.2, 11.4, 11.5, 11.10)");
  await test("UC-11.5", "Tra cứu lịch trống 2 dịch vụ ngày mai", async () => {
    const d = ok(await C.bao.get(`/api/booking/slots?serviceIds=2,1&date=${day(1)}`));
    eq(d.totalDuration, 90, "tổng thời lượng");
    const slot = firstAvailable(d.slots, { maxEnd: "14:00" });
    check(slot, "không có khung giờ trống nào trước 14:00 ngày mai");
    ctx.baoSlot = slot;
    return `${d.slots.filter((s) => s.available).length} khung trống, chọn ${slot.startTime}`;
  });
  await test("UC-11.2", "Đặt lịch online 2 dịch vụ (trả tại quầy)", async () => {
    const slot = need(ctx.baoSlot, "khung giờ");
    const d = ok(await C.bao.post("/api/booking/online", {
      services: [{ serviceId: 2 }, { serviceId: 1 }], appointmentDate: day(1), startTime: slot.startTime, paymentChoice: "Counter", notes: "API test " + RUN }));
    check(d.appointmentId, "không trả về appointmentId");
    ctx.baoAppt = d.appointmentId;
    return `#${d.appointmentId}, hóa đơn #${d.invoiceId}`;
  });
  await test("UC-11.1", "Chi tiết lịch vừa đặt: Pending, 2 dịch vụ liên tiếp, hóa đơn 450.000đ", async () => {
    const d = await detail(C.bao, need(ctx.baoAppt, "lịch"));
    eq(d.status, "Pending", "trạng thái");
    eq(d.services.length, 2, "số dịch vụ");
    eq(d.services[0].endTime?.slice(0, 5), d.services[1].startTime?.slice(0, 5), "dịch vụ 2 bắt đầu ngay khi dịch vụ 1 kết thúc");
    check(d.invoice, "không có hóa đơn");
    eq(d.invoice.totalAmount, 450000, "tổng tiền (hạng Standard 0%)");
    check(d.actions?.includes("cancel") && d.actions?.includes("reschedule"), `thiếu nút hủy/đổi lịch, actions=${JSON.stringify(d.actions)}`);
  });
  await test("BR-02", "Không đặt quá 4 dịch vụ", async () =>
    status(await C.bao.post("/api/booking/online", { services: [1, 2, 4, 5, 7].map((s) => ({ serviceId: s })), appointmentDate: day(2), startTime: "08:30" }), 400));
  await test("BR-06", "Không đặt lịch online đã qua giờ / sát giờ", async () =>
    status(await C.yen.post("/api/booking/online", { services: [{ serviceId: 1 }], appointmentDate: TODAY, startTime: "08:30" }), [400, 409]));
  await test("BR-06", "Không đặt lịch online quá 30 ngày", async () =>
    status(await C.yen.post("/api/booking/online", { services: [{ serviceId: 1 }], appointmentDate: day(35), startTime: "09:00" }), [400, 409]));
  await test("BR-04", "Khách không đặt 2 lịch trùng giờ", async () => {
    const slot = need(ctx.baoSlot, "khung giờ");
    status(await C.bao.post("/api/booking/online", { services: [{ serviceId: 9 }], appointmentDate: day(1), startTime: slot.startTime }), 409);
  });
  await test("BR-07", "Phòng Body đang hoạt động: tra cứu dịch vụ Body có khung trống", async () => {
    const d = ok(await C.yen.get(`/api/booking/slots?serviceIds=8&date=${day(2)}`));
    check(firstAvailable(d.slots), "không có khung trống cho Tắm trắng – kiểm tra KTV có kỹ năng/ca và giường phòng Body");
  });
  await test("UC-11.4", "Khách đổi lịch sang ngày kia (lịch quay về Pending)", async () => {
    const id = need(ctx.baoAppt, "lịch");
    const s = ok(await C.bao.get(`/api/booking/slots?serviceIds=2,1&date=${day(2)}&appointmentId=${id}`));
    const slot = firstAvailable(s.slots, { minStart: "13:00" }) || firstAvailable(s.slots);
    check(slot, "không có khung trống ngày kia");
    ok(await C.bao.put(`/api/appointments/${id}/reschedule`, { services: [{ serviceId: 2 }, { serviceId: 1 }], appointmentDate: day(2), startTime: slot.startTime, reason: "API test" }));
    const d = await detail(C.bao, id);
    eq(String(d.appointmentDate).slice(0, 10), day(2), "ngày hẹn mới");
    eq(d.status, "Pending", "trạng thái");
    check(d.invoice && Number(d.invoice.totalAmount) === 450000, "hóa đơn phải được tạo lại 450.000đ sau đổi lịch");
  });
  await test("UC-11.6", "Lễ tân xác nhận lịch online", async () => {
    const id = need(ctx.baoAppt, "lịch");
    ok(await C.receptionist.put(`/api/appointments/${id}/confirm`, {}));
    eq((await detail(C.receptionist, id)).status, "Confirmed", "trạng thái");
  });
  await test("UC-11.10", "Khách hủy lịch → hóa đơn chưa thanh toán bị hủy", async () => {
    const id = need(ctx.baoAppt, "lịch");
    const r = ok(await C.bao.put(`/api/appointments/${id}/cancel`, { reason: "API test hủy" }));
    check(r?.refundRequired === false || r?.refundRequired === undefined, "không cần hoàn tiền khi chưa thanh toán");
    const d = await detail(C.bao, id);
    eq(d.status, "Cancelled", "trạng thái lịch");
    if (d.invoice) eq(d.invoice.status, "Cancelled", "trạng thái hóa đơn");
  });

  section("4. Đặt lịch dùng gói – khách hoa.nguyen (UC-11.2, UC-14.1, BR-17)");
  await test("UC-14.1", "Danh sách gói còn buổi có gói da mặt (đã trừ buổi đang giữ)", async () => {
    const list = ok(await C.hoa.get("/api/booking/my-packages"));
    const facial = list.find((p) => (p.services || []).some((s) => Number(s.serviceId) === 2));
    check(facial, "không thấy gói có dịch vụ Chăm sóc da mặt cơ bản");
    ctx.hoaPkg = facial.customerPackageId;
    check(Number(facial.availableSessions) <= Number(facial.remainingSessions) - 1,
      `buổi có thể đặt phải trừ buổi đang giữ cho lịch #14 (còn ${facial.remainingSessions}, có thể đặt ${facial.availableSessions})`);
    return `còn ${facial.remainingSessions}, có thể đặt ${facial.availableSessions}`;
  });
  await test("UC-11.2", "Đặt lịch 1 dịch vụ dùng gói + 1 dịch vụ trả tiền", async () => {
    const pkg = need(ctx.hoaPkg, "gói");
    const s = ok(await C.hoa.get(`/api/booking/slots?serviceIds=2,1&date=${day(4)}`));
    const slot = need(firstAvailable(s.slots), "khung trống ngày +4");
    const d = ok(await C.hoa.post("/api/booking/online", {
      services: [{ serviceId: 2, customerPackageId: pkg }, { serviceId: 1 }], appointmentDate: day(4), startTime: slot.startTime, paymentChoice: "Counter" }));
    ctx.hoaAppt = d.appointmentId;
    const det = await detail(C.hoa, d.appointmentId);
    eq(det.services[0].unitPrice, 0, "dòng dùng gói 0đ");
    eq(det.invoice?.subtotal, 150000, "tạm tính chỉ gồm gội đầu");
    eq(det.invoice?.totalAmount, 142500, "sau giảm Silver 5%");
  });
  await test("UC-11.4", "Đổi lịch lịch có hóa đơn (lỗi khóa ngoại InvoiceService đã sửa)", async () => {
    const id = need(ctx.hoaAppt, "lịch");
    const s = ok(await C.hoa.get(`/api/booking/slots?serviceIds=2,1&date=${day(5)}&appointmentId=${id}`));
    const slot = need(firstAvailable(s.slots), "khung trống ngày +5");
    ok(await C.hoa.put(`/api/appointments/${id}/reschedule`, {
      services: [{ serviceId: 2, customerPackageId: need(ctx.hoaPkg, "gói") }, { serviceId: 1 }], appointmentDate: day(5), startTime: slot.startTime }));
    const det = await detail(C.hoa, id);
    eq(det.invoice?.totalAmount, 142500, "hóa đơn sau đổi lịch");
  });
  await test("BR-17", "Không dùng gói cho dịch vụ không thuộc gói", async () =>
    status(await C.hoa.post("/api/booking/online", { services: [{ serviceId: 5, customerPackageId: need(ctx.hoaPkg, "gói") }], appointmentDate: day(6), startTime: "09:00" }), [400, 404, 409]));

  section("5. Lịch 3 dịch vụ chia 2 KTV (BR-11) – khách yen.ngo");
  await test("BR-11", "Đặt 3 dịch vụ → chia 2 phần", async () => {
    const s = ok(await C.yen.get(`/api/booking/slots?serviceIds=5,7,2&date=${day(3)}`));
    const parts = new Set((s.services || []).map((l) => l.part));
    eq(parts.size, 2, "số phần KTV");
    const slot = need(firstAvailable(s.slots), "khung trống ngày +3");
    const d = ok(await C.yen.post("/api/booking/online", { services: [5, 7, 2].map((x) => ({ serviceId: x })), appointmentDate: day(3), startTime: slot.startTime }));
    ctx.yenAppt = d.appointmentId;
    return `#${d.appointmentId} ${slot.startTime}-${slot.endTime}`;
  });

  section("6. Lễ tân: xác nhận, check-in, không đến, tạo lịch tại quầy (UC-11.3, 11.6–11.8)");
  await test("UC-11.6", "Xác nhận lịch Pending #12 (ngày mai)", async () => {
    ok(await C.receptionist.put("/api/appointments/12/confirm", {}));
    eq((await detail(C.receptionist, 12)).status, "Confirmed", "trạng thái");
  });
  await test("TIME", "Lịch ngày mai: chưa check-in / chưa đánh dấu Không đến được", async () => {
    status(await C.receptionist.put("/api/booking/checkin", { appointmentId: 12, assignments: [] }), 409, "check-in trước ngày hẹn");
    status(await C.receptionist.put("/api/appointments/12/no-show", {}), 409, "Không đến trước giờ hẹn");
    const d = await detail(C.receptionist, 12);
    check(!(d.actions || []).includes("checkin") && !(d.actions || []).includes("noShow"), "chi tiết lịch không được hiện nút Check-in/Không đến");
  });
  const outside = (start) => nowMinutes() < start - 60 || nowMinutes() > start + 15;
  const lateFor = { 9: outside(14 * 60), 10: outside(15 * 60) };
  const LATE_NOTE = "chỉ có khi chạy test trong khoảng 13:00–14:15 (giờ VN)";
  await test("UC-18.7", "Bảng điều phối hôm nay có KTV và lịch cần đón", async () => {
    const b = ok(await C.receptionist.get(`/api/booking/coordination?date=${TODAY}`));
    check((b.technicians || []).length >= 3, "bảng điều phối thiếu KTV");
    const a9 = (b.arrivals || []).find((a) => a.appointmentId === 9);
    check(a9, "không thấy lịch #9 trong danh sách đón khách");
    eq(a9.canCheckIn, !lateFor[9], "cờ canCheckIn của lịch #9");
    return a9.timingNote || "";
  });
  for (const id of [9, 10]) {
    await test("UC-11.8", `Check-in lịch #${id} với KTV/giường được gợi ý (BR-12, BR-20)`, async () => {
      if (lateFor[id]) {
        status(await C.receptionist.put("/api/booking/checkin", { appointmentId: id, assignments: [] }), 409, "ngoài khung check-in phải bị chặn");
        return "ngoài khung check-in (60 phút trước – 15 phút sau giờ hẹn) nên bị chặn đúng";
      }
      const plan = ok(await C.receptionist.get(`/api/booking/coordination?appointmentId=${id}`));
      const assignments = assignmentsFromPlan(plan);
      for (const a of assignments) {
        check(a.technicianId, `dòng ${a.appointmentServiceId} không có KTV gợi ý/ứng viên`);
        check(a.bedId, `dòng ${a.appointmentServiceId} không còn giường trống`);
      }
      ok(await C.receptionist.put("/api/booking/checkin", { appointmentId: id, assignments }));
      const d = await detail(C.receptionist, id);
      eq(d.status, "Checked-in", "trạng thái");
      ctx[`tech${id}`] = d.services[0].technicianId;
      ctx[`lines${id}`] = lineIds(d);
      return `KTV ${[...new Set(d.services.map((l) => l.technicianName))].join(", ")}`;
    });
  }
  await test("BR-12", "Tour được cộng cho KTV sau check-in", async () => {
    const r = ok(await C.manager.get(`/api/operations/tour-report?date=${TODAY}`));
    const tech = need(ctx.tech9, "KTV lịch #9 – " + LATE_NOTE);
    const row = (r.rows || []).find((x) => x.staffId === tech);
    check(row && Number(row.countedTours) >= 2, `KTV ${tech} chưa được cộng 2 tour cho dịch vụ chuyên sâu`);
  });
  await test("UC-11.7", "Đánh dấu không đến lịch #11 (09:00)", async () => {
    const after = nowMinutes() >= 9 * 60 + 15;
    const r = await C.receptionist.put("/api/appointments/11/no-show", {});
    if (after) { ok(r); eq((await detail(C.receptionist, 11)).status, "No-show", "trạng thái"); return "đã quá 09:15"; }
    status(r, 409, "chưa trễ 15 phút phải bị chặn");
    return "trước 09:15 nên bị chặn đúng";
  });
  await test("UC-11.3", "Lễ tân tạo lịch tại quầy cho khách walk-in #9 (Confirmed ngay)", async () => {
    const s = ok(await C.receptionist.get(`/api/booking/slots?serviceIds=5&date=${day(1)}`));
    const slot = need(firstAvailable(s.slots), "khung trống");
    const d = ok(await C.receptionist.post("/api/appointments", { customerId: 9, services: [{ serviceId: 5 }], appointmentDate: day(1), startTime: slot.startTime, paymentChoice: "Counter" }));
    ctx.walkin = d.appointmentId;
    eq((await detail(C.receptionist, d.appointmentId)).status, "Confirmed", "trạng thái");
  });
  await test("UC-11.3", "Lễ tân tạo lịch có KTV khách yêu cầu", async () => {
    const s = ok(await C.receptionist.get(`/api/booking/slots?serviceIds=4&date=${day(2)}&technicianId=5`));
    const slot = need(firstAvailable(s.slots, { minStart: "14:00" }), "khung trống với KTV Hương");
    const d = ok(await C.receptionist.post("/api/appointments", { customerId: 4, services: [{ serviceId: 4 }], appointmentDate: day(2), startTime: slot.startTime, technicianId: 5 }));
    const det = await detail(C.receptionist, d.appointmentId);
    eq(det.services[0].technicianId, 5, "KTV được yêu cầu");
  });

  section("7. Kỹ thuật viên: thực hiện dịch vụ (UC-15.1, 15.2)");
  await test("UC-15.1", "KTV Hương thấy lịch #8 trong danh sách hôm nay", async () => {
    const list = ok(await C.huong.get(`/api/treatment-status?fromDate=${TODAY}&toDate=${TODAY}`));
    const mine = list.filter((l) => l.appointmentId === 8);
    eq(mine.length, 2, "số dòng của lịch #8");
    ctx.l8 = mine.sort((a, b) => a.lineNo - b.lineNo).map((l) => l.appointmentServiceId);
  });
  await test("BR-02", "Không bắt đầu dịch vụ 2 khi dịch vụ 1 chưa xong", async () =>
    status(await C.huong.put(`/api/treatment-status/${need(ctx.l8, "dòng #8")[1]}/start`, {}), 409));
  await test("SEC", "KTV khác không thao tác được dòng không giao cho mình", async () =>
    status(await C.mai.put(`/api/treatment-status/${need(ctx.l8, "dòng #8")[0]}/start`, {}), [403, 409]));
  await test("UC-15.1", "Bắt đầu dịch vụ 1 → lịch In-progress, giường đang dùng", async () => {
    const r = await C.huong.put(`/api/treatment-status/${need(ctx.l8, "dòng #8")[0]}/start`, {});
    if (nowMinutes() < 9 * 60 + 45) { status(r, 409, "chưa tới 09:45 phải bị chặn"); return "trước 09:45 nên bị chặn đúng (lịch #8 lúc 10:00)"; }
    ok(r);
    ctx.started8 = true;
    eq((await detail(C.receptionist, 8)).status, "In-progress", "trạng thái lịch");
    const board = ok(await C.receptionist.get("/api/room-bed-status"));
    const bed = (board.rooms || []).flatMap((r) => r.beds || []).find((b) => b.bedId === 1);
    eq(bed?.useState, "InUse", "giường F1-01");
  });
  await test("UC-15.1", "Hoàn thành dịch vụ 1 (dùng gói) → gói Tâm còn 5 buổi", async () => {
    need(ctx.started8, "dịch vụ 1 của lịch #8 đã bắt đầu (chạy test sau 09:45)");
    ok(await C.huong.put(`/api/treatment-status/${need(ctx.l8, "dòng #8")[0]}/done`, {}));
    const pk = ok(await C.receptionist.get("/api/customer-packages/6"));
    eq(pk[0]?.remainingSessions, 5, "buổi còn lại của gói");
  });
  await test("UC-15.2", "Ghi kết quả điều trị dịch vụ 1", async () => {
    need(ctx.started8, "dịch vụ 1 của lịch #8 đã làm (chạy test sau 09:45)");
    ok(await C.huong.put(`/api/treatment-outcomes/${need(ctx.l8, "dòng #8")[0]}`, { notes: "API test: da cải thiện", skinReaction: "Không" }));
    const o = ok(await C.huong.get(`/api/treatment-outcomes/${ctx.l8[0]}`));
    check(String(o.notes || o.resultNotes || "").includes("API test"), "kết quả chưa được lưu");
  });
  await test("UC-15.1", "Làm dịch vụ 2 → lịch #8 Completed", async () => {
    need(ctx.started8, "dịch vụ 1 của lịch #8 đã làm (chạy test sau 09:45)");
    ok(await C.huong.put(`/api/treatment-status/${need(ctx.l8, "dòng #8")[1]}/start`, {}));
    const r = ok(await C.huong.put(`/api/treatment-status/${ctx.l8[1]}/done`, {}));
    check(r?.appointmentCompleted === true, "appointmentCompleted phải là true");
    eq((await detail(C.receptionist, 8)).status, "Completed", "trạng thái lịch");
  });
  await test("UC-15.1", "KTV được giao lịch #9 bắt đầu và hoàn thành", async () => {
    const tech = need(ctx.tech9, "KTV lịch #9 – " + LATE_NOTE);
    const email = need(TECH_EMAIL[tech], `tài khoản KTV ${tech}`);
    const c = new Client("tech9");
    ok(await c.post("/api/login", { email, password: PASSWORD }));
    const line = need(ctx.lines9, "dòng #9")[0];
    if (nowMinutes() < 13 * 60 + 45) { status(await c.put(`/api/treatment-status/${line}/start`, {}), 409, "chưa tới 13:45"); return "trước 13:45 nên bị chặn đúng"; }
    ok(await c.put(`/api/treatment-status/${line}/start`, {}));
    ok(await c.put(`/api/treatment-status/${line}/done`, {}));
    eq((await detail(C.receptionist, 9)).status, "Completed", "trạng thái");
  });

  section("8. Thanh toán, voucher, hoàn tiền (UC-16, UC-17, BR-16, BR-19)");
  await test("UC-16.1", "Thu ngân thấy hóa đơn chưa thanh toán của lịch #10", async () => {
    const list = ok(await C.receptionist.get("/api/invoices/unpaid-appointments"));
    const row = list.find((r) => r.appointmentId === 10);
    check(row, "không thấy lịch #10");
    ctx.inv10 = row.invoiceId;
    eq(row.canCollect, !!ctx.lines10, "cờ canCollect (chỉ thu khi đã check-in)");
    const future = list.find((r) => r.appointmentId === 16);
    check(future && future.canCollect === false, "lịch #16 (chưa tới ngày) phải có canCollect=false");
  });
  await test("TIME", "Không thu tiền tại quầy khi khách chưa check-in (lịch #16)", async () => {
    const row = ok(await C.receptionist.get("/api/invoices/unpaid-appointments")).find((r) => r.appointmentId === 16);
    status(await C.receptionist.post(`/api/invoices/${need(row, "hóa đơn lịch #16").invoiceId}/pay`, { paymentMethod: "Cash" }), 409);
  });
  await test("BR-16", "Áp voucher WELCOME10 cho hóa đơn VVIP: giảm hạng 20% trước, voucher sau", async () => {
    const r = ok(await C.receptionist.post(`/api/invoices/${need(ctx.inv10, "hóa đơn #10")}/voucher`, { voucherCode: "WELCOME10" }));
    eq(r.tierDiscount, 190000, "giảm hạng");
    eq(r.voucherDiscount, 76000, "giảm voucher (10% của 760.000)");
    eq(r.totalAmount, 684000, "phải trả");
  });
  await test("UC-17", "Voucher không tồn tại bị từ chối", async () =>
    status(await C.receptionist.post(`/api/invoices/${need(ctx.inv10, "hóa đơn")}/voucher`, { voucherCode: "KHONGCO" + RUN }), [404, 409, 400]));
  await test("UC-17", "Voucher hết hạn (SUMMER20) bị từ chối", async () =>
    status(await C.receptionist.post(`/api/invoices/${need(ctx.inv10, "hóa đơn")}/voucher`, { voucherCode: "SUMMER20" }), [409, 400]));
  await test("UC-16.2", "Thu tiền mặt hóa đơn lịch #10", async () => {
    const id = need(ctx.inv10, "hóa đơn");
    ok(await C.receptionist.post(`/api/invoices/${id}/voucher`, { voucherCode: "WELCOME10" }));
    const r = await C.receptionist.post(`/api/invoices/${id}/pay`, { paymentMethod: "Cash" });
    if (!ctx.lines10) { status(r, 409, "lịch #10 chưa check-in nên chưa được thu"); return "lịch #10 chưa check-in nên bị chặn đúng"; }
    ok(r);
    ctx.paid10 = true;
    eq(ok(await C.receptionist.get(`/api/invoices/${id}`)).status, "Paid", "trạng thái hóa đơn");
  });
  await test("UC-16.2", "Chuyển khoản thiếu mã giao dịch / hợp lệ", async () => {
    const list = ok(await C.receptionist.get("/api/invoices/unpaid-appointments"));
    const row = list.find((r) => r.appointmentId === 8);
    need(row, "hóa đơn lịch #8");
    ok(await C.receptionist.post(`/api/invoices/${row.invoiceId}/pay`, { paymentMethod: "BankTransfer", transactionCode: "FT" + RUN }));
    ctx.inv8 = row.invoiceId;
  });
  await test("UC-16.2", "Không thu tiền 2 lần", async () =>
    status(await C.receptionist.post(`/api/invoices/${need(ctx.inv8, "hóa đơn lịch #8")}/pay`, { paymentMethod: "Cash" }), [400, 409]));
  await test("UC-11.4", "Lễ tân hủy lịch tại quầy chưa thu tiền → hóa đơn bị hủy, không cần hoàn tiền (BR-19)", async () => {
    const id = need(ctx.walkin, "lịch tại quầy của khách #9");
    const inv = need((await detail(C.receptionist, id)).invoice?.invoiceId, "hóa đơn lịch tại quầy");
    const c = ok(await C.receptionist.put(`/api/appointments/${id}/cancel`, { reason: "API test hủy lịch" }), "hủy lịch");
    check(c?.refundRequired === false, "lịch chưa thanh toán không cần hoàn tiền");
    eq(ok(await C.manager.get(`/api/invoices/${inv}`)).status, "Cancelled", "trạng thái hóa đơn");
  });
  await test("UC-16.5", "Không hoàn tiền hóa đơn của lịch đã làm xong", async () =>
    status(await C.manager.post(`/api/invoices/${need(ctx.inv8, "hóa đơn lịch #8")}/refund`, { reason: "x" }), 409));
  await test("UC-16.3", "Quản lý hủy hóa đơn chưa thanh toán (lịch #13)", async () => {
    const list = ok(await C.manager.get("/api/invoices?status=Unpaid"));
    const row = list.find((r) => r.appointmentId === 13);
    need(row, "hóa đơn lịch #13");
    ok(await C.manager.post(`/api/invoices/${row.invoiceId}/cancel`, { reason: "API test hủy hóa đơn" }));
  });
  await test("SEC", "Lễ tân không được hoàn tiền", async () =>
    status(await C.receptionist.post(`/api/invoices/1/refund`, { reason: "x" }), 403));
  await test("BR-18", "Khách tạo link VNPay cho hóa đơn của mình (cần cấu hình VNPAY_TMN_CODE)", async () => {
    const id = need(ctx.hoaAppt, "lịch của Hoa");
    const det = await detail(C.hoa, id);
    const r = ok(await C.hoa.post("/api/payments/vnpay/create", { invoiceId: need(det.invoice?.invoiceId, "hóa đơn") }));
    check(String(r.paymentUrl || "").startsWith("http"), "không có paymentUrl");
  });
  await test("BR-15", "Chi tiêu & hạng VVIP của khách Diệp tăng sau thanh toán", async () => {
    const m = ok(await C.receptionist.get("/api/membership-tiers?customerId=7"));
    check(Number(m.lifetimeSpending) >= 23600000 + (ctx.paid10 ? 684000 : 0), `chi tiêu ${m.lifetimeSpending} chưa được cộng`);
    return ctx.paid10 ? "" : "lịch #10 chưa thu tiền (chạy test trước 15:15 để thử)";
  });

  section("9. Gói liệu trình: bán tại quầy & mua online (UC-14)");
  await test("UC-14.2", "Lễ tân bán gói trị mụn cho khách yen.ngo (tiền mặt)", async () => {
    const r = ok(await C.receptionist.post("/api/customer-packages/sell", { customerId: 8, treatmentPackageId: 3, paymentMethod: "Cash" }));
    ctx.soldPackageInvoice = r.invoiceId;
    check(r.customerPackage, "gói chưa được kích hoạt");
    eq(r.customerPackage.remainingSessions, 8, "số buổi");
  });
  await test("UC-14.3", "Khách mua gói online tạo hóa đơn chờ VNPay", async () => {
    const r = ok(await C.bao.post("/api/package-purchases", { treatmentPackageId: 4 }));
    check(r.invoiceId, "không có invoiceId");
  });
  await test("UC-14.1", "Khách thấy gói vừa mua trong Liệu trình của tôi", async () => {
    const list = ok(await C.yen.get("/api/customer-packages"));
    check(list.some((p) => p.treatmentPackageId === 3), "không thấy gói trị mụn");
  });
  await test("UC-16.5", "Quản lý hoàn tiền gói chưa dùng buổi nào (tiền mặt)", async () => {
    const inv = need(ctx.soldPackageInvoice, "hóa đơn bán gói");
    const r = ok(await C.manager.post(`/api/invoices/${inv}/refund`, { reason: "API test hoàn tiền gói" }));
    eq(ok(await C.manager.get(`/api/invoices/${inv}`)).status, "Refunded", "trạng thái hóa đơn");
    return r?.message;
  });

  section("10. Quản lý danh mục (UC-7, UC-8, UC-10, UC-17)");
  const svcName = `Dịch vụ test ${RUN}`;
  await test("UC-7.2", "Thêm dịch vụ (tour đề xuất, loại phòng, KTV)", async () => {
    const r = ok(await C.manager.post("/api/service", { serviceName: svcName, description: "API test", category: "Facial", requiredRoomType: "Facial",
      price: 350000, duration: 45, status: "Active", technicianIds: [4, 5] }));
    ctx.svc = r.serviceId;
    const list = ok(await C.manager.get("/api/service"));
    const s = list.find((x) => x.serviceId === r.serviceId);
    eq(s?.tourCount, 1, "tour đề xuất cho 45 phút (30–60 phút = 1 tour)");
  });
  await test("UC-7.2", "Không thêm dịch vụ trùng tên / thời lượng lẻ", async () => {
    status(await C.manager.post("/api/service", { serviceName: svcName, requiredRoomType: "Facial", price: 1000, duration: 45 }), [400, 409]);
    status(await C.manager.post("/api/service", { serviceName: svcName + "b", requiredRoomType: "Facial", price: 1000, duration: 40 }), 400);
  });
  await test("UC-7.3", "Sửa dịch vụ", async () => {
    ok(await C.manager.put(`/api/service?id=${need(ctx.svc, "dịch vụ")}`, { serviceName: svcName, description: "sửa", category: "Facial", requiredRoomType: "Facial",
      price: 380000, duration: 60, tourCount: 1, status: "Active", technicianIds: [4] }));
    const t = ok(await C.manager.get(`/api/service?technicians=${ctx.svc}`));
    check(Array.isArray(t), "không đọc được KTV của dịch vụ");
  });
  await test("UC-7.4", "Xóa dịch vụ = ngừng kinh doanh (Inactive)", async () => {
    ok(await C.manager.del(`/api/service?id=${need(ctx.svc, "dịch vụ")}`));
    const s = ok(await C.manager.get("/api/service")).find((x) => x.serviceId === ctx.svc);
    eq(s?.status, "Inactive", "trạng thái");
  });
  const pkgName = `Gói test ${RUN}`;
  await test("UC-8", "Thêm / sửa / ngừng bán gói liệu trình nhiều dịch vụ", async () => {
    ok(await C.manager.post("/api/treatment-packages", { packageName: pkgName, description: "API", price: 2000000, numberOfSessions: 5, validityDays: 60, serviceIds: [2, 3] }));
    let p = ok(await C.manager.get("/api/treatment-packages")).find((x) => x.packageName === pkgName);
    check(p && p.serviceIds?.length === 2, "gói chưa có 2 dịch vụ");
    ok(await C.manager.put("/api/treatment-packages", { ...p, price: 2100000, serviceIds: [2] }));
    ok(await C.manager.del(`/api/treatment-packages?id=${p.treatmentPackageId}`));
    p = ok(await C.manager.get("/api/treatment-packages")).find((x) => x.packageName === pkgName);
    eq(p?.status, "Inactive", "trạng thái sau khi ngừng bán");
  });
  await test("UC-10", "Thêm phòng, thêm giường, xóa giường, xóa phòng chưa dùng", async () => {
    const room = `Phòng test ${RUN}`;
    ok(await C.manager.post("/api/rooms", { roomName: room, roomType: "Massage", status: "Active" }));
    const r = ok(await C.manager.get("/api/rooms")).find((x) => x.roomName === room);
    need(r, "phòng vừa tạo");
    ok(await C.manager.post("/api/beds", { roomId: r.roomId, bedNumber: "T-01", status: "Active" }));
    const b = ok(await C.manager.get(`/api/beds?roomId=${r.roomId}`))[0];
    need(b, "giường vừa tạo");
    ok(await C.manager.del(`/api/beds?id=${b.bedId}`));
    ok(await C.manager.del(`/api/rooms?id=${r.roomId}`));
  });
  await test("UC-10.4", "Không xóa được phòng đã có lịch sử", async () => status(await C.manager.del("/api/rooms?id=1"), [400, 409]));
  await test("UC-10.3", "Chuyển giường sang bảo trì trả về lịch bị ảnh hưởng", async () => {
    const r = ok(await C.manager.put("/api/beds", { bedId: 2, roomId: 1, bedNumber: "F1-02", status: "Maintenance" }));
    check(Array.isArray(r.affectedAppointments), "không có danh sách lịch bị ảnh hưởng");
    ok(await C.manager.put("/api/beds", { bedId: 2, roomId: 1, bedNumber: "F1-02", status: "Active" }));
  });
  const code = ("T" + RUN).toUpperCase();
  await test("UC-17", "Tạo / sửa / ngừng voucher", async () => {
    const r = ok(await C.manager.post("/api/vouchers", { action: "create", voucherCode: code, voucherName: "Voucher test", discountType: "Amount",
      discountValue: 30000, minOrderAmount: 100000, maxUses: 5, startDate: TODAY, endDate: day(10) }));
    const id = need(r.voucherId, "voucherId");
    ok(await C.manager.post("/api/vouchers", { action: "update", voucherId: id, voucherCode: code, voucherName: "Voucher test 2", discountType: "Percent",
      discountValue: 15, minOrderAmount: 0, maxDiscount: 50000, maxUses: 5, startDate: TODAY, endDate: day(10) }));
    ok(await C.manager.post("/api/vouchers", { action: "setStatus", voucherId: id, status: "Inactive" }));
  });
  await test("UC-13.2", "Cập nhật mô tả quyền lợi hạng Silver", async () => {
    ok(await C.manager.put("/api/membership-tiers?id=2", { description: "Giảm 5% – cập nhật bởi API test" }));
  });
  await test("UC-19", "Dashboard trả số liệu doanh thu & no-show", async () => {
    const d = ok(await C.manager.get(`/api/dashboard-reports?fromDate=${day(-7)}&toDate=${TODAY}`));
    check(Number(d.grossRevenue) > 0, "doanh thu 7 ngày bằng 0");
    check(Array.isArray(d.dailyCash) && d.dailyCash.length === 8, "doanh thu theo ngày phải có 8 ngày");
  });

  section("11. Nhân sự, ca làm, nghỉ phép (UC-5, UC-18)");
  const username = `ktv${RUN}`;
  await test("UC-5.2", "Tạo KTV mới có kỹ năng", async () => {
    ok(await C.manager.post("/api/staff", { action: "create", fullName: "KTV Test " + RUN, email: `${username}@bssms.vn`, phone: "09" + String(Date.now()).slice(-8),
      role: "Technician", username, password: "123456", hireDate: TODAY, serviceIds: [1, 2] }));
    const s = ok(await C.manager.get("/api/staff")).find((x) => x.username === username);
    need(s, "nhân viên vừa tạo");
    ctx.newStaff = s.staffId; ctx.newAccount = s.accountId;
    const skills = ok(await C.manager.get(`/api/staff?skillsOf=${s.staffId}`));
    eq(skills.length, 2, "số kỹ năng");
  });
  await test("UC-18.1", "Phân ca, đổi ca, xóa ca cho KTV mới", async () => {
    const staff = need(ctx.newStaff, "KTV mới");
    status(await C.manager.post("/api/operations/scheduling", { action: "createShifts", staffIds: [staff], dates: [day(-1)], shiftType: "Morning" }), 400, "phân ca cho ngày đã qua");
    ok(await C.manager.post("/api/operations/scheduling", { action: "createShifts", staffIds: [staff], dates: [day(1), day(2)], shiftType: "Morning" }));
    const sch = ok(await C.manager.get(`/api/operations/scheduling?date=${day(1)}`));
    const shift = (sch.shifts || []).find((s) => s.staffId === staff && String(s.shiftDate).slice(0, 10) === day(1));
    need(shift, "ca vừa tạo");
    ok(await C.manager.post("/api/operations/scheduling", { action: "updateShift", id: shift.staffShiftId, shiftType: "FullDay" }));
    ok(await C.manager.post("/api/operations/scheduling", { action: "deleteShift", id: shift.staffShiftId }));
  });
  await test("BR-14", "Không tạo 2 ca cùng ngày cho 1 người (ca trùng bị bỏ qua)", async () => {
    const r = ok(await C.manager.post("/api/operations/scheduling", { action: "createShifts", staffIds: [4], dates: [day(1)], shiftType: "Morning" }));
    check(JSON.stringify(r).includes("4@") || Number(r.created) === 0, `ca trùng không bị bỏ qua: ${JSON.stringify(r)}`);
  });
  await test("UC-18.5", "KTV Mai xin nghỉ rồi hủy đơn", async () => {
    ok(await C.mai.post("/api/operations/leaves", { action: "request", startDate: day(12), endDate: day(12), reason: "API test" }));
    const l = ok(await C.mai.get(`/api/operations/my-schedule?date=${day(12)}`)).leaves?.find((x) => String(x.startDate).slice(0, 10) === day(12) && x.status === "Pending");
    need(l, "đơn nghỉ vừa tạo");
    ok(await C.mai.post("/api/operations/leaves", { action: "cancel", id: l.leaveId }));
  });
  await test("UC-18.6", "Quản lý xem lịch bị ảnh hưởng của đơn nghỉ #2 rồi duyệt", async () => {
    const appts = ok(await C.manager.get("/api/operations/leave-appointments?date=2"));
    check(appts.some((a) => a.appointmentId === 16), "đơn nghỉ #2 phải có lịch #16");
    ok(await C.manager.post("/api/operations/leaves", { action: "decide", id: 2, decision: "Approved", note: "API test" }));
  });
  await test("UC-11.9", "Lịch #16 xuất hiện trong lịch bị ảnh hưởng và được điều phối lại", async () => {
    const list = ok(await C.receptionist.get("/api/booking/affected"));
    check(list.some((r) => r.appointmentId === 16), "lịch #16 không có trong danh sách bị ảnh hưởng");
    const plan = ok(await C.receptionist.get("/api/booking/affected?appointmentId=16"));
    const assignments = (plan.lines || []).map((l) => ({
      appointmentServiceId: l.appointmentServiceId,
      technicianId: l.suggestedTechnicianId ?? (l.technicianOptions || []).find((o) => o.staffId !== 4)?.staffId ?? null,
      bedId: l.bedId ?? null,
    }));
    check(assignments.every((a) => a.technicianId && a.technicianId !== 4), `không có KTV thay thế: ${JSON.stringify(plan.lines)}`);
    ok(await C.receptionist.put("/api/booking/coordinate", { appointmentId: 16, assignments }));
    const after = ok(await C.receptionist.get("/api/booking/affected"));
    check(!after.some((r) => r.appointmentId === 16), "lịch #16 vẫn còn bị ảnh hưởng sau điều phối");
  });
  await test("UC-11.9", "Lịch #15 (KTV Ngọc nghỉ đã duyệt) được điều phối", async () => {
    const plan = ok(await C.receptionist.get("/api/booking/affected?appointmentId=15"));
    const assignments = (plan.lines || []).map((l) => ({ appointmentServiceId: l.appointmentServiceId,
      technicianId: l.suggestedTechnicianId ?? (l.technicianOptions || []).find((o) => o.staffId !== 7)?.staffId ?? null, bedId: l.bedId ?? null }));
    check(assignments.every((a) => a.technicianId), "không có KTV thay thế cho lịch #15");
    ok(await C.receptionist.put("/api/booking/coordinate", { appointmentId: 15, assignments }));
  });
  await test("UC-5.4", "Vô hiệu hóa KTV mới (không có lịch tương lai)", async () => {
    ok(await C.manager.post("/api/staff", { action: "update-status", accountId: need(ctx.newAccount, "accountId"), status: "Inactive" }));
  });

  section("12. Đánh giá & hồ sơ khách (UC-9, UC-12)");
  await test("UC-9.1", "Khách Hoa đánh giá dịch vụ gội đầu của lịch #1", async () => {
    ok(await C.hoa.post("/api/feedback", { appointmentId: 1, serviceId: 1, appointmentServiceId: 1, customerId: 1, rating: 5, comment: "API test: rất hài lòng" }));
  });
  await test("UC-9.1", "Không đánh giá 2 lần cùng một dịch vụ", async () =>
    status(await C.hoa.post("/api/feedback", { appointmentId: 1, serviceId: 1, appointmentServiceId: 1, customerId: 1, rating: 4, comment: "lần 2" }), [400, 409]));
  await test("UC-12.1", "Lễ tân xem hồ sơ & lịch sử điều trị khách Tâm", async () => {
    const s = ok(await C.receptionist.get("/api/treatment-profiles?customerId=6&action=summary"));
    check(s.fullName, "không có tên khách");
    const h = ok(await C.receptionist.get("/api/treatment-profiles?customerId=6&action=history"));
    check(h.some((x) => String(x.resultNotes || "").includes("API test")), "lịch sử chưa có kết quả vừa ghi");
  });
  await test("UC-12.2", "Lễ tân cập nhật hồ sơ sức khỏe", async () =>
    ok(await C.receptionist.post("/api/treatment-profiles", { action: "update-health", customerId: 6, skinCondition: "Da mụn ẩn", allergies: "Không", notes: "API test" })));
  await test("UC-12.3", "Khách xem lịch sử dịch vụ của mình", async () => {
    const h = ok(await C.hoa.get("/api/service-history"));
    check(Array.isArray(h) && h.length >= 2, "lịch sử dịch vụ của Hoa phải có ít nhất 2 dòng");
  });
}

function report() {
  const count = (r) => results.filter((x) => x.result === r).length;
  const pass = count("PASS"), fail = count("FAIL"), skip = count("SKIP");
  console.log(`\nTổng: ${results.length} bước – \x1b[32m${pass} PASS\x1b[0m, \x1b[31m${fail} FAIL\x1b[0m, \x1b[33m${skip} SKIP\x1b[0m`);
  const lines = [
    `# Báo cáo kiểm thử API BSSMS`, ``,
    `- Máy chủ: ${BASE}`, `- Thời điểm: ${vnNow().toISOString().replace("T", " ").slice(0, 16)} (giờ VN)`,
    `- Kết quả: **${pass} PASS / ${fail} FAIL / ${skip} SKIP** trên ${results.length} bước`, ``,
  ];
  if (fail) {
    lines.push(`## Bước lỗi`, ``);
    for (const r of results.filter((x) => x.result === "FAIL")) {
      lines.push(`### [${r.uc}] ${r.name}`, `- Nhóm: ${r.section}`, `- Lỗi: ${r.note}`);
      if (r.call) lines.push(`- API: \`${r.call}\``);
      if (r.body) lines.push("- Phản hồi:", "```", r.body, "```");
      lines.push("");
    }
  }
  if (skip) {
    lines.push(`## Bước bỏ qua`, ``);
    for (const r of results.filter((x) => x.result === "SKIP")) lines.push(`- [${r.uc}] ${r.name} – ${r.note}`);
    lines.push("");
  }
  lines.push(`## Toàn bộ kết quả`, ``, `| # | Nhóm | UC | Bước | Kết quả | Ghi chú |`, `|---|---|---|---|---|---|`);
  results.forEach((r, i) => lines.push(`| ${i + 1} | ${r.section} | ${r.uc} | ${r.name.replace(/\|/g, "/")} | ${r.result} | ${String(r.note).replace(/\|/g, "/").replace(/\n/g, " ")} |`));
  const out = join(dirname(fileURLToPath(import.meta.url)), "bssms-test-report.md");
  writeFileSync(out, lines.join("\n"), "utf8");
  console.log(`Đã ghi báo cáo: ${out}`);
  process.exitCode = fail ? 1 : 0;
}

main().catch((e) => { console.error(e); results.push({ section: current, uc: "RUNNER", name: "Lỗi script", result: "FAIL", note: e.message }); }).finally(report);
