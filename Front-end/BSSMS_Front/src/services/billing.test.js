import { describe, it, expect } from "vitest";
import { monthRange, refundableAmount } from "./billing";
describe("Billing calculations", () => {
  it("includes leap day and never drops the last day in Vietnam time", () => {
    expect(monthRange("2024-02")).toEqual(["2024-02-01", "2024-02-29"]);
    expect(monthRange("2026-02")).toEqual(["2026-02-01", "2026-02-28"]);
    expect(monthRange("2026-12")).toEqual(["2026-12-01", "2026-12-31"]);
  });
  it("sums all settled payments and subtracts only settled refunds", () =>
    expect(
      refundableAmount({
        payments: [
          { status: "Success", amount: 40000 },
          { status: "Success", amount: "60000" },
          { status: "Failed", amount: 50000 },
        ],
        refunds: [
          { status: "Success", amount: 40000 },
          { status: "Pending", amount: 60000 },
        ],
      }),
    ).toBe(60000));
  it("handles an invoice without payments", () =>
    expect(refundableAmount(null)).toBe(0));
});
