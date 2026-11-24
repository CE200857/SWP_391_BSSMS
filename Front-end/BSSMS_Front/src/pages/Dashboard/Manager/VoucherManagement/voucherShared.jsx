// Shared, presentation-only pieces for CreateVoucherModal and UpdateVoucherModal. No API calls here.
import { Alert, Col, Form, Row } from "react-bootstrap";
import { today } from "../../../../services/api";

export const emptyVoucherForm = {
  voucherId: 0, voucherCode: "", voucherName: "", discountType: "Percent", discountValue: "",
  minOrderAmount: 0, maxDiscount: "", maxUses: 100, startDate: "", endDate: "",
};

export const buildVoucherBody = (form, action) => ({
  action,
  voucherId: form.voucherId || undefined,
  voucherCode: form.voucherCode.trim().toUpperCase(),
  voucherName: form.voucherName.trim(),
  discountType: form.discountType,
  discountValue: Number(form.discountValue),
  minOrderAmount: Number(form.minOrderAmount || 0),
  maxDiscount: form.discountType === "Percent" && form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
  maxUses: Number(form.maxUses),
  startDate: form.startDate,
  endDate: form.endDate,
});

export function VoucherFields({ form, setForm }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      {form.usedCount > 0 && <Alert variant="info">Voucher has been used {form.usedCount} uses, so the code cannot be changed.</Alert>}
      <Row className="g-3">
        <Col md={4}><Form.Label className="fw-bold">Voucher code*</Form.Label>
          <Form.Control value={form.voucherCode} onChange={set("voucherCode")} pattern="[A-Za-z0-9_\-]{3,50}" disabled={form.usedCount > 0} required /></Col>
        <Col md={8}><Form.Label className="fw-bold">Voucher name*</Form.Label>
          <Form.Control value={form.voucherName} onChange={set("voucherName")} maxLength={100} required /></Col>
        <Col md={4}><Form.Label className="fw-bold">Discount type*</Form.Label>
          <Form.Select value={form.discountType} onChange={set("discountType")}><option value="Percent">Percent (%)</option><option value="Amount">Amount (VND)</option></Form.Select></Col>
        <Col md={4}><Form.Label className="fw-bold">Discount value*</Form.Label>
          <Form.Control type="number" min="1" max={form.discountType === "Percent" ? 100 : undefined} value={form.discountValue} onChange={set("discountValue")} required /></Col>
        <Col md={4}><Form.Label className="fw-bold">Maximum discount (VND)</Form.Label>
          <Form.Control type="number" min="1000" step="1000" value={form.maxDiscount} onChange={set("maxDiscount")} disabled={form.discountType !== "Percent"} /></Col>
        <Col md={4}><Form.Label className="fw-bold">Minimum spend (VND)</Form.Label>
          <Form.Control type="number" min="0" step="1000" value={form.minOrderAmount} onChange={set("minOrderAmount")} /></Col>
        <Col md={4}><Form.Label className="fw-bold">Usage limit *</Form.Label>
          <Form.Control type="number" min={Math.max(1, form.usedCount || 0)} value={form.maxUses} onChange={set("maxUses")} required /></Col>
        <Col md={4} />
        <Col md={4}><Form.Label className="fw-bold">Start date*</Form.Label>
          <Form.Control type="date" value={form.startDate} onChange={set("startDate")} required /></Col>
        <Col md={4}><Form.Label className="fw-bold">End date*</Form.Label>
          <Form.Control type="date" min={form.voucherId ? form.startDate : [form.startDate, today()].filter(Boolean).sort().pop()} value={form.endDate} onChange={set("endDate")} required /></Col>
      </Row>
    </>
  );
}
