import { describe, expect, it } from "vitest";
import { filterListRows } from "./ManagerSearchFilter";

describe("manager list filtering", () => {
    const rows = [
        { name: "Linh", status: "Active", date: "2026-10-12T10:00:00" },
        { name: "Minh", status: "Inactive", date: "2026-10-20T10:00:00" },
        { name: "An", status: "Active", date: "2026-11-02T10:00:00" },
    ];
    const fields = [
        { key: "name", label: "Tên", filterable: false },
        {
            key: "status",
            label: "Trạng thái",
            formatValue: (value) => value === "Active" ? "Đang hoạt động" : "Không hoạt động",
        },
        { key: "date", label: "Ngày", type: "date" },
    ];

    it("combines text, selected options, and date range filters", () => {
        expect(filterListRows(rows, fields, "  ĐANG HOẠT ĐỘNG ", {
            status: ["Active"],
            date: { from: "2026-10-01", to: "2026-10-31" },
            name: [],
        })).toEqual([rows[0]]);
    });

    it("returns all rows when no search or filter is active", () => {
        expect(filterListRows(rows, fields, "", {
            status: [],
            date: { from: "", to: "" },
            name: [],
        })).toEqual(rows);
    });
});
