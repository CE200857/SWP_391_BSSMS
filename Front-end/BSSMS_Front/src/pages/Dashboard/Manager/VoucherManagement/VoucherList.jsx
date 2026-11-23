import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { api, post, del, money, viDate, today } from "../../../../services/api";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";
import { StatusToggleButton, StatusChangeModal } from "../../../../components/StatusToggle";
import FloatingAlert from "../../../../components/FloatingAlert";

const statusMeta = {
  Active: { bg: "success", text: "Applying" },
  Inactive: { bg: "secondary", text: "Inactive" },
  Expired: { bg: "dark", text: "Expired" },
  UsedUp: { bg: "warning", text: "Used up" },
};
const emptyForm = {
  voucherId: 0, voucherCode: "", voucherName: "", discountType: "Percent", discountValue: "",
  minOrderAmount: 0, maxDiscount: "", maxUses: 100, startDate: "", endDate: "",
};
const value = (v) => (v.discountType === "Percent" ? `${Number(v.discountValue)}%` : money(v.discountValue));

export default function VoucherList() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api("/api/vouchers"));
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const { filteredRows, toolbar } = useManagerSearchFilter(
    rows,
    [
      { key: "voucherCode", label: "Code", filterable: false },
      { key: "voucherName", label: "Name", filterable: false },
      { key: "discountType", label: "Discount type", formatValue: (v) => (v === "Percent" ? "Percent" : "Amount") },
      { key: "status", label: "Status", formatValue: (v) => statusMeta[v]?.text || v },
      { key: "endDate", label: "End date", type: "date" },
    ],
    "Search by voucher code or name...",
  );

  const open = (v) => {
    setFormError("");
    setForm(v ? {
      ...emptyForm, ...v, maxDiscount: v.maxDiscount ?? "",
      startDate: String(v.startDate).slice(0, 10), endDate: String(v.endDate).slice(0, 10),
    } : emptyForm);
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body = {
        action: form.voucherId ? "update" : "create", voucherId: form.voucherId || undefined,
        voucherCode: form.voucherCode.trim().toUpperCase(), voucherName: form.voucherName.trim(), discountType: form.discountType,
        discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount || 0),
        maxDiscount: form.discountType === "Percent" && form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
        maxUses: Number(form.maxUses), startDate: form.startDate, endDate: form.endDate,
      };
      const r = await post("/api/vouchers", body);
      setNotice(r.message);
      setForm(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };
  // Xoa mem: voucher bien khoi danh sach, van giu trong DB cho cac hoa don da dung
  const remove = async (v) => {
    if (!window.confirm(`Delete voucher ${v.voucherCode}? It is removed from the list and can no longer be used. Invoices that already used it are kept.`)) return;
    try {
      const r = await del(`/api/vouchers?id=${v.voucherId}`);
      setNotice(r?.message || "Voucher deleted.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  // Bấm nhãn trạng thái: bật/tắt voucher (thay cho 2 nút Stop/Reactivate)
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setStatusBusy(true);
    await setStatus(statusTarget, statusTarget.rawStatus === "Active" ? "Inactive" : "Active");
    setStatusBusy(false);
    setStatusTarget(null);
  };

  const setStatus = async (v, status) => {
    try {
      const r = await post("/api/vouchers", { action: "setStatus", voucherId: v.voucherId, status });
      setNotice(r.message);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Voucher management</h2>
          <p className="text-muted mb-0">Shared vouchers by code, with limited uses and validity. Applied after the membership tier discount.</p>
        </div>
        {isManager && <Button className="fw-bold" onClick={() => open(null)}><i className="bi bi-plus-lg me-1" /> Create voucher</Button>}
      </div>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      <Card className="shadow-sm border-0 mb-4"><Card.Body><div className="manager-list-toolbar">{toolbar}</div></Card.Body></Card>
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark">
              <tr><th>Code</th><th>Discount</th><th>Used</th><th>Valid until</th><th>Status</th>{isManager && <th className="text-center">Actions</th>}</tr>
            </thead>
            <tbody>
              {filteredRows.map((v) => (
                <tr key={v.voucherId}>
                  {/* Mỗi ô 1 dòng; tên, điều kiện và ngày bắt đầu hiện khi rê chuột vào */}
                  <td className="fw-bold text-dark text-nowrap" title={v.voucherName || undefined}>{v.voucherCode}</td>
                  <td className="text-nowrap" title={[v.maxDiscount ? `Max ${money(v.maxDiscount)}` : "", Number(v.minOrderAmount) > 0 ? `Orders from ${money(v.minOrderAmount)}` : "All orders"].filter(Boolean).join(" · ")}>{value(v)}</td>
                  <td>{v.usedCount}/{v.maxUses}</td>
                  <td className="text-nowrap" title={`From ${viDate(v.startDate)}`}>{viDate(v.endDate)}</td>
                  <td>{isManager
                    ? <StatusToggleButton active={v.status === "Active"} label={v.rawStatus === "Active" ? (statusMeta[v.status]?.text || v.status) : "Inactive"} onClick={() => setStatusTarget(v)} />
                    : <Badge bg={statusMeta[v.status]?.bg || "secondary"}>{statusMeta[v.status]?.text || v.status}</Badge>}</td>
                  {isManager && (
                    <td className="text-center">
                      <div className="manager-list-actions">
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => open(v)}><i className="bi bi-pencil-square" /> Edit</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => remove(v)}><i className="bi bi-trash" /> Delete</Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!filteredRows.length && <tr><td colSpan={8} className="text-center text-muted py-4">No vouchers yet.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!form} onHide={() => !saving && setForm(null)} centered size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-light"><Modal.Title className="fw-bold">{form?.voucherId ? "Update voucher" : "Create voucher"}</Modal.Title></Modal.Header>
        {form && (
          <Form onSubmit={save}>
            <Modal.Body>
              <FloatingAlert message={formError} onClose={() => setFormError("")} />
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
            </Modal.Body>
            <Modal.Footer className="bg-light border-0">
              <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{form.voucherId ? "Save changes" : "Create voucher"}</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      <StatusChangeModal
        show={!!statusTarget}
        entity="voucher"
        name={statusTarget?.voucherCode}
        nextActive={statusTarget?.rawStatus !== "Active"}
        busy={statusBusy}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </Container>
  );
}
