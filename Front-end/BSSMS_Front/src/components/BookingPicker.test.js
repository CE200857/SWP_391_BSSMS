import { describe, expect, it } from "vitest";
import { estimateTotal, packagesFor, toServiceLines } from "./BookingPicker";
import { staffSection } from "./staffNavigation";
import { managerSection } from "./managerNavigation";

describe("BookingPicker helpers (BR-02)", () => {
  const services = [{ serviceId: 1, price: 300000 }, { serviceId: 2, price: 200000 }];
  const packages = [{ customerPackageId: 9, availableSessions: 1, services: [{ serviceId: 1 }] }];

  it("chỉ gửi các dòng đã chọn dịch vụ", () => {
    expect(toServiceLines([{ serviceId: "1", customerPackageId: "" }, { serviceId: "", customerPackageId: "" }]))
      .toEqual([{ serviceId: 1, customerPackageId: null }]);
  });

  it("buổi dùng gói không tính tiền", () => {
    expect(estimateTotal([{ serviceId: "1", customerPackageId: "9" }, { serviceId: "2", customerPackageId: "" }], services)).toBe(200000);
  });

  it("một buổi gói không dùng cho hai dòng của cùng lịch", () => {
    const lines = [{ serviceId: "1", customerPackageId: "9" }, { serviceId: "1", customerPackageId: "" }];
    expect(packagesFor(packages, lines, 0)).toHaveLength(1);
    expect(packagesFor(packages, lines, 1)).toHaveLength(0);
  });
});

describe("điều hướng theo vai trò", () => {
  it("menu lễ tân có check-in & điều phối", () => {
    expect(staffSection("Receptionist", "/receptionist/coordination")?.link[1]).toBe("Check-in & điều phối");
  });
  it("menu quản lý có duyệt nghỉ phép", () => {
    expect(managerSection("/manager/leaves")?.group[0]).toBe("staff");
  });
});
