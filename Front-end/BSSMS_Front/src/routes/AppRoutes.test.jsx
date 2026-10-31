import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";

const renderRoute = (path, user = null) =>
  renderToString(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes user={user} setUser={vi.fn()} />
    </MemoryRouter>,
  );

describe("Guest routes", () => {
  beforeEach(() => {
    globalThis.localStorage = { getItem: vi.fn(() => null) };
  });

  it("shows only public navigation on the service catalog", () => {
    const html = renderRoute("/guest/services");

    expect(html).toContain("Trang chủ");
    expect(html).toContain("Danh sách dịch vụ");
    expect(html).not.toContain("Tra cứu lịch trống");
    expect(html).toContain("Đăng nhập");
    expect(html).not.toContain("Lịch hẹn");
  });

  it("renders the public service detail route", () => {
    const html = renderRoute("/guest/services/42");

    expect(html).toContain("Chi tiết dịch vụ");
    expect(html).toContain("Đang tải thông tin dịch vụ");
  });

  it("does not render slot lookup for guests", () => {
    const html = renderRoute("/guest/slots");

    expect(html).not.toContain("Tra cứu lịch trống");
    expect(html).not.toContain("Tìm khung giờ dành cho bạn");
    expect(html).not.toContain("Chọn dịch vụ để tra cứu lịch trống");
    expect(html).not.toContain("Tạo lịch tại quầy");
  });
});

describe("Customer booking route", () => {
  it("renders the appointment form and booking summary", () => {
    const html = renderRoute("/appointments/online", {
      role: "Customer",
      fullName: "Khách hàng",
    });

    expect(html).toContain("Đặt lịch hẹn online");
    expect(html).toContain("Hình thức sử dụng dịch vụ");
    expect(html).toContain("Thông tin đặt hẹn");
    expect(html).toContain("Xác nhận Đặt lịch Online");
  });
});

describe("Separate login portals", () => {
  it("renders a staff login without customer registration or homepage navigation", () => {
    const html = renderRoute("/dashboard/login");
    expect(html).toContain("Đăng nhập Dashboard");
    expect(html).toContain("Hiện mật khẩu");
    expect(html).not.toContain('href="/register"');
    expect(html).not.toContain("app-public-header");
  });
  it("does not expose protected slots through a direct URL", () => {
    const html = renderRoute("/slots?serviceId=2");
    expect(html).not.toContain("Tìm khung giờ dành cho bạn");
  });
  it("renders slots for a customer", () => {
    const html = renderRoute("/slots?serviceId=2", { role: "Customer" });
    expect(html).toContain("Tìm khung giờ dành cho bạn");
  });
});

describe("Operations permissions", () => {
  beforeEach(() => {
    globalThis.localStorage = { getItem: vi.fn(() => null) };
    globalThis.sessionStorage = { getItem: vi.fn(() => null) };
  });
  it.each([
    "/manager/scheduling",
    "/manager/catalog-rules",
    "/manager/stock",
    "/manager/policy",
    "/manager/purchase-orders",
  ])("renders Manager function %s", (path) => {
    const html = renderRoute(path, { role: "Manager" });
    expect(html).toContain("app-dashboard-shell");
    expect(html).toContain("manager-section-nav");
  });
  it.each(["Customer", "Receptionist", "Technician"])(
    "does not render policy editor for %s",
    (role) => {
      expect(renderRoute("/manager/policy", { role })).not.toContain(
        "Chính sách &amp; chốt hoa hồng",
      );
    },
  );
  it("shows customer invoices without manager refund actions", () => {
    const html = renderRoute("/invoices", { role: "Customer" });
    expect(html).toContain("Hóa đơn của tôi");
    expect(html).not.toContain("Yêu cầu hoàn toàn bộ");
  });
});

describe("Shared staff workspaces", () => {
  it.each(["Receptionist", "Technician"])(
    "gives %s a grouped sidebar and overview",
    (role) => {
      const html = renderRoute(`/${role.toLowerCase()}/dashboard`, { role });
      expect(html).toContain("manager-sidebar");
      expect(html).not.toContain('class="manager-section-nav"');
      expect(html).toContain("staff-metrics");
      expect(html).not.toContain('href="/manager/policy"');
      expect(html).not.toContain('href="/staffs"');
    },
  );
  it.each(["Receptionist", "Technician", "Manager"])(
    "keeps %s service catalog in staff layout",
    (role) => {
      const html = renderRoute("/services", { role });
      expect(html).toContain("table-responsive");
      expect(html).not.toContain("public-service-hero");
      if (role !== "Manager")
        expect(html).not.toContain('href="/services/new"');
    },
  );
  it("explains deferred payment on the booking page", () => {
    const html = renderRoute("/appointments/online", { role: "Customer" });
    expect(html).toContain("chưa thu tiền và chưa có mã QR");
    expect(html).toContain("lễ tân chưa xác nhận lịch");
  });
});
