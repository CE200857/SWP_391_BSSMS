import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";
import ManagerSidebar from "../components/ManagerSidebar";
import ManagerDashboard from "../pages/Dashboard/Manager/ManagerDashboard";
import { managerGroups, managerSection } from "../components/managerNavigation";

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

  it("lets guests view treatment packages without purchase tools", () => {
    const html = renderRoute("/guest/treatment-packages");

    expect(html).toContain("Gói liệu trình chăm sóc");
    expect(html).not.toContain("Bán gói liệu trình");
    expect(html).not.toContain("app-dashboard-shell");
  });
  it("shows the read-only package catalogue to customers", () => {
    const html = renderRoute("/treatment-packages", { role: "Customer" });

    expect(html).toContain("Gói liệu trình chăm sóc");
    expect(html).not.toContain("Thêm gói");
    expect(html).toContain("Mua gói ngay trên web");
  });
  it("does not offer online purchase to guests", () => {
    const html = renderRoute("/guest/treatment-packages");

    expect(html).not.toContain("Mua và thanh toán");
    expect(html).not.toContain("Mua gói ngay trên web");
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
  it("renders a staff login without customer registration or the public header", () => {
    const html = renderRoute("/dashboard/login");
    expect(html).toContain("Đăng nhập");
    expect(html).toContain("STAFF PORTAL");
    expect(html).toContain("Hiện mật khẩu");
    expect(html).toContain('class="app-footer"');
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
    "/manager/feedback-moderation",
    "/feedback",
  ])("renders Manager function %s", (path) => {
    const html = renderRoute(path, { role: "Manager" });
    expect(html).toContain("app-dashboard-shell");
    expect(html).toContain('aria-controls="manager-submenu-');
    expect(html).not.toContain('class="manager-section-nav"');
  });
  it.each(["Customer", "Receptionist", "Technician"])(
    "does not render policy editor for %s",
    (role) => {
      expect(renderRoute("/manager/policy", { role })).not.toContain(
        "Chính sách &amp; chốt hoa hồng",
      );
    },
  );
  it.each(["Customer", "Receptionist", "Technician"])(
    "does not render feedback moderation for %s",
    (role) => {
      expect(renderRoute("/manager/feedback-moderation", { role })).not.toContain(
        "Duyệt đánh giá khách hàng",
      );
    },
  );
  it("limits check-in and resource coordination to receptionists", () => {
    const receptionist = renderRoute("/receptionist/coordination", {
      role: "Receptionist",
    });
    const manager = renderRoute("/receptionist/coordination", {
      role: "Manager",
    });

    expect(receptionist).toContain(
      "Check-in &amp; điều phối dịch vụ (Receptionist)",
    );
    expect(manager).not.toContain(
      "Check-in &amp; điều phối dịch vụ (Receptionist)",
    );
    expect(managerSection("/receptionist/coordination")).toBeUndefined();
  });
  it("shows customer invoices without manager refund actions", () => {
    const html = renderRoute("/invoices", { role: "Customer" });
    expect(html).toContain("Hóa đơn của tôi");
    expect(html).not.toContain("Yêu cầu hoàn toàn bộ");
  });
  it("keeps the appointment list focused on essential scan fields", () => {
    const html = renderRoute("/appointments", { role: "Manager" });
    expect(html).toContain("Ngày &amp; giờ");
    expect(html).toContain("Khách hàng");
    expect(html).toContain("Dịch vụ");
    expect(html).toContain("Trạng thái");
    expect(html).not.toContain("<th class=\"py-3\">Nhân viên</th>");
    expect(html).not.toContain("<th class=\"py-3\">Phòng</th>");
  });
});

describe("Concise management lists", () => {
  const tableColumnCount = (html) => (html.match(/<th(?:\s|>)/g) || []).length;

  it("moves secondary staff and customer information out of list columns", () => {
    const staff = renderRoute("/staffs", { role: "Manager" });
    const customers = renderRoute("/customers", { role: "Manager" });

    expect(tableColumnCount(staff)).toBe(4);
    expect(tableColumnCount(customers)).toBe(4);
  });

});

describe("Manager function groups", () => {
  const groupFor = (path) => managerSection(path)?.group;
  const groupIds = (group) => group?.[3].map(([path]) => path);

  it("keeps appointment and treatment workflow together", () => {
    expect(groupFor("/appointments")?.[1]).toBe("Lịch hẹn & điều trị");
    expect(groupFor("/treatment-status")?.[0]).toBe("booking");
    expect(managerGroups.flatMap(([, , , links]) => links)
      .filter(([path]) => ["/treatment-status", "/my-treatment-profile"].includes(path)))
      .toEqual([["/my-treatment-profile", "Quản lý liệu trình & trạng thái"]]);
  });

  it("groups service setup separately from physical resources", () => {
    expect(groupFor("/manager/catalog-rules")?.[0]).toBe("catalog");
    expect(groupFor("/manager/resources")?.[0]).toBe("resources");
    expect(groupFor("/update-room-bed-status")?.[0]).toBe("resources");
    expect(managerGroups
      .flatMap(([, , , links]) => links)
      .filter(([path]) => ["/manager/resources", "/update-room-bed-status"].includes(path)))
      .toEqual([["/manager/resources", "Quản lý tài nguyên"]]);
  });

  it("keeps Manager room status controls in resource CRUD instead of a duplicate status tab", () => {
    const resources = renderRoute("/manager/resources", { role: "Manager" });
    const statusBookmark = renderRoute("/update-room-bed-status", { role: "Manager" });

    expect(resources).toContain("Danh mục tài nguyên");
    expect(resources).not.toContain("Trạng thái phòng &amp; giường");
    expect(statusBookmark).toContain("Danh mục tài nguyên");
    expect(statusBookmark).not.toContain("Trạng thái vận hành phòng &amp; giường");
    expect(statusBookmark).not.toContain("Trạng thái phòng &amp; giường</button>");
  });

  it.each(["Receptionist", "Technician"])(
    "keeps the dedicated room and bed status page for %s",
    (role) => {
      const html = renderRoute("/update-room-bed-status", { role });
      expect(html).toContain("Trạng thái vận hành phòng &amp; giường");
    },
  );

  it("keeps customer feedback and loyalty features together", () => {
    expect(groupFor("/manager/feedback-moderation")?.[0]).toBe("customers");
    const feedbackLinks = managerGroups
      .flatMap(([, , , links]) => links)
      .filter(([path]) => ["/feedback", "/manager/feedback-moderation"].includes(path));
    expect(feedbackLinks).toEqual([["/feedback", "Quản lý đánh giá"]]);
    expect(groupFor("/manager/membership-tiers")?.[0]).toBe("customers");
    const membershipLinks = managerGroups
      .flatMap(([, , , links]) => links)
      .filter(([path]) => ["/membership-benefits", "/manager/membership-tiers"].includes(path));
    expect(membershipLinks).toEqual([["/manager/membership-tiers", "Quyền lợi & hạng thành viên"]]);
    expect(managerSection("/membership-benefits")?.link).toEqual([
      "/manager/membership-tiers",
      "Quyền lợi & hạng thành viên",
    ]);
    expect(groupFor("/vouchers")?.[0]).toBe("customers");
    const voucherLinks = managerGroups
      .flatMap(([, , , links]) => links)
      .filter(([path]) => ["/vouchers", "/birthday-promotions"].includes(path));
    expect(voucherLinks).toEqual([["/vouchers", "Voucher & ưu đãi sinh nhật"]]);
    expect(managerSection("/birthday-promotions")?.link).toEqual([
      "/vouchers",
      "Voucher & ưu đãi sinh nhật",
    ]);
  });

  it("combines public reviews and moderation for Managers", () => {
    const html = renderRoute("/feedback", { role: "Manager" });

    expect(html).toContain("Quản lý đánh giá khách hàng");
    expect(html).toContain("Tổng đánh giá công khai");
    expect(html).not.toContain("Đánh giá khách hàng</span>");
  });

  it("combines membership benefits and tier management for Managers", () => {
    const html = renderRoute("/membership-benefits", { role: "Manager" });

    expect(html).toContain("Quyền lợi &amp; hạng thành viên");
    expect(html).not.toContain("Quyền lợi theo hạng");
    expect(html).toContain("Danh sách hạng");
    expect(html).toContain("Thêm hạng");
  });

  it("redirects the birthday promotion bookmark to the combined voucher workspace", () => {
    const html = renderRoute("/birthday-promotions", { role: "Manager" });

    expect(html).toContain('href="/vouchers"');
    expect(html).toContain("Voucher &amp; ưu đãi sinh nhật");
    expect(html).not.toContain("Cấp ưu đãi tháng này");
  });

  it("groups employee commission with staff and monthly close with finance", () => {
    const finance = managerGroups.find(([id]) => id === "finance");
    const staff = managerGroups.find(([id]) => id === "staff");
    expect(groupIds(staff)).toContain("/manager/commission/report");
    expect(groupIds(finance)).not.toContain("/manager/commission/report");
    expect(groupIds(finance)).toContain("/manager/policy");
  });

  it("keeps supplier ordering and inventory in one stock workflow", () => {
    expect(groupFor("/manager/purchase-orders")?.[0]).toBe("stock");
    expect(groupFor("/manager/stock")?.[0]).toBe("stock");
  });
});

describe("Manager sidebar collapse", () => {
  it("hides expanded group links when the sidebar is collapsed", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/appointments"]}>
        <ManagerSidebar role="Manager" collapsed onToggle={vi.fn()} />
      </MemoryRouter>,
    );

    expect(html).toContain('class="app-sidebar manager-sidebar collapsed"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('class="manager-submenu"');
  });
});

describe("Manager dashboard navigation", () => {
  it("omits the quick navigation strip from the overview", () => {
    const html = renderToString(
      <MemoryRouter>
        <ManagerDashboard />
      </MemoryRouter>,
    );

    expect(html).not.toContain('aria-label="Truy cập nhanh"');
    expect(html).toContain("Tổng quan &amp; báo cáo");
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
