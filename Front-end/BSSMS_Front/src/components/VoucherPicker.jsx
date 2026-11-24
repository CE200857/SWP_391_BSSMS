// Dropdown of vouchers that can be used right now. Picking one fills in its code and applies it.
// orderAmount (optional): the amount the voucher is checked against; vouchers whose minimum is higher are shown disabled.
import { useEffect, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { api, money, viDate } from "../services/api";

const discountText = (v) =>
  v.discountType === "Percent"
    ? `${Number(v.discountValue)}% off${v.maxDiscount ? ` (max ${money(v.maxDiscount)})` : ""}`
    : `${money(v.discountValue)} off`;

export default function VoucherPicker({ onPick, orderAmount, selectedCode, disabled, size = "sm" }) {
  const [vouchers, setVouchers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api("/api/vouchers?available=1")
      .then((r) => alive && setVouchers(Array.isArray(r) ? r : []))
      .catch((e) => { if (alive) { setVouchers([]); setError(e.message); } });
    return () => { alive = false; };
  }, []);

  const tooLow = (v) => orderAmount != null && Number(orderAmount) < Number(v.minOrderAmount || 0);
  const usable = (vouchers || []).filter((v) => !tooLow(v)).length;

  return (
    <Dropdown className="voucher-picker" align="end">
      <Dropdown.Toggle size={size} variant="outline-success" disabled={disabled || vouchers === null} className="text-nowrap">
        <i className="bi bi-ticket-perforated" /> {vouchers === null ? "Loading…" : `Choose voucher${usable ? ` (${usable})` : ""}`}
      </Dropdown.Toggle>
      <Dropdown.Menu className="voucher-picker-menu">
        {error && <Dropdown.ItemText className="small text-danger">{error}</Dropdown.ItemText>}
        {!error && vouchers?.length === 0 && <Dropdown.ItemText className="small text-muted">No vouchers available right now.</Dropdown.ItemText>}
        {(vouchers || []).map((v) => {
          const low = tooLow(v);
          return (
            <Dropdown.Item
              key={v.voucherId}
              as="button"
              type="button"
              disabled={low}
              active={selectedCode === v.voucherCode}
              onClick={() => onPick(v.voucherCode)}
              className="voucher-picker-item"
            >
              <div className="d-flex justify-content-between gap-3">
                <strong className="voucher-picker-code">{v.voucherCode}</strong>
                <span className="voucher-picker-off">{discountText(v)}</span>
              </div>
              <div className="voucher-picker-name">{v.voucherName}</div>
              <div className="voucher-picker-meta">
                {Number(v.minOrderAmount) > 0 ? `Min. order ${money(v.minOrderAmount)} · ` : ""}
                Until {viDate(v.endDate)} · {v.remainingUses} left
                {low && <span className="text-danger"> · Order too small</span>}
              </div>
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
}
