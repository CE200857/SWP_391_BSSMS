import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { api, post, money, viDate, today } from "../../../../services/api";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";

const statusMeta = {
  Active: { bg: "success", text: "Đang áp dụng" },
  Inactive: { bg: "secondary", text: "Ngừng áp dụng" },
  Expired: { bg: "dark", text: "Hết hạn" },
  UsedUp: { bg: "warning", text: "Hết lượt" },
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
      { key: "voucherCode", label: "Mã", filterable: false },
      { key: "voucherName", label: "Tên", filterable: false },
      { key: "discountType", label: "Loại giảm", formatValue: (v) => (v === "Percent" ? "Phần trăm" : "Số tiền") },
      { key: "status", label: "Trạng thái", formatValue: (v) => statusMeta[v]?.text || v },
      { key: "endDate", label: "Ngày kết thúc", type: "date" },
    ],
    "Tìm theo mã hoặc tên voucher...",
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
          <h2 className="manager-page-title fw-bold mb-1">Quản lý voucher</h2>
          <p className="text-muted mb-0">Voucher dùng chung theo mã, giới hạn số lượt và thời hạn. Áp dụng sau ưu đãi hạng thành viên.</p>
        </div>
        {isManager && <Button className="fw-bold" onClick={() => open(null)}><i className="bi bi-plus-lg me-1" /> Tạo voucher</Button>}
      </div>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}

      <Card className="shadow-sm border-0 mb-4"><Card.Body><div className="manager-list-toolbar">{toolbar}</div></Card.Body></Card>
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark">
              <tr><th>Mã</th><th>Tên</th><th>Giảm</th><th>Điều kiện</th><th>Đã dùng</th><th>Thời hạn</th><th>Trạng thái</th>{isManager && <th className="text-center">Hành động</th>}</tr>
            </thead>
            <tbody>
              {filteredRows.map((v) => (
                <tr key={v.voucherId}>
                  <td className="fw-bold text-primary">{v.voucherCode}</td>
                  <td>{v.voucherName}</td>
                  <td>{value(v)}{v.maxDiscount ? <small className="d-block text-muted">Tối đa {money(v.maxDiscount)}</small> : null}</td>
                  <td>{Number(v.minOrderAmount) > 0 ? `Đơn từ ${money(v.minOrderAmount)}` : "Mọi đơn"}</td>
                  <td>{v.usedCount}/{v.maxUses}</td>
                  <td>{viDate(v.startDate)} – {viDate(v.endDate)}</td>
                  <td><Badge bg={statusMeta[v.status]?.bg || "secondary"}>{statusMeta[v.status]?.text || v.status}</Badge></td>
                  {isManager && (
                    <td className="text-center">
                      <div className="manager-list-actions">
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => open(v)}><i className="bi bi-pencil-square" /> Sửa</Button>
                        {v.rawStatus === "Active" ? (
                          <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => setStatus(v, "Inactive")}><i className="bi bi-slash-circle" /> Ngừng</Button>
                        ) : (
                          <Button variant="link" size="sm" className="manager-list-action manager-list-action--view" onClick={() => setStatus(v, "Active")}><i className="bi bi-arrow-counterclockwise" /> Áp dụng lại</Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!filteredRows.length && <tr><td colSpan={8} className="text-center text-muted py-4">Chưa có voucher.</td></tr>}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!form} onHide={() => !saving && setForm(null)} centered size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-light"><Modal.Title className="fw-bold">{form?.voucherId ? "Cập nhật voucher" : "Tạo voucher"}</Modal.Title></Modal.Header>
        {form && (
          <Form onSubmit={save}>
            <Modal.Body>
              {formError && <Alert variant="danger">{formError}</Alert>}
              {form.usedCount > 0 && <Alert variant="info">Voucher đã được dùng {form.usedCount} lượt nên không đổi được mã.</Alert>}
              <Row className="g-3">
                <Col md={4}><Form.Label className="fw-bold">Mã voucher*</Form.Label>
                  <Form.Control value={form.voucherCode} onChange={set("voucherCode")} pattern="[A-Za-z0-9_\-]{3,50}" disabled={form.usedCount > 0} required /></Col>
                <Col md={8}><Form.Label className="fw-bold">Tên voucher*</Form.Label>
                  <Form.Control value={form.voucherName} onChange={set("voucherName")} maxLength={100} required /></Col>
                <Col md={4}><Form.Label className="fw-bold">Loại giảm*</Form.Label>
                  <Form.Select value={form.discountType} onChange={set("discountType")}><option value="Percent">Phần trăm (%)</option><option value="Amount">Số tiền (VNĐ)</option></Form.Select></Col>
                <Col md={4}><Form.Label className="fw-bold">Giá trị giảm*</Form.Label>
                  <Form.Control type="number" min="1" max={form.discountType === "Percent" ? 100 : undefined} value={form.discountValue} onChange={set("discountValue")} required /></Col>
                <Col md={4}><Form.Label className="fw-bold">Giảm tối đa (VNĐ)</Form.Label>
                  <Form.Control type="number" min="1000" step="1000" value={form.maxDiscount} onChange={set("maxDiscount")} disabled={form.discountType !== "Percent"} /></Col>
                <Col md={4}><Form.Label className="fw-bold">Đơn tối thiểu (VNĐ)</Form.Label>
                  <Form.Control type="number" min="0" step="1000" value={form.minOrderAmount} onChange={set("minOrderAmount")} /></Col>
                <Col md={4}><Form.Label className="fw-bold">Số lượt sử dụng*</Form.Label>
                  <Form.Control type="number" min={Math.max(1, form.usedCount || 0)} value={form.maxUses} onChange={set("maxUses")} required /></Col>
                <Col md={4} />
                <Col md={4}><Form.Label className="fw-bold">Ngày bắt đầu*</Form.Label>
                  <Form.Control type="date" value={form.startDate} onChange={set("startDate")} required /></Col>
                <Col md={4}><Form.Label className="fw-bold">Ngày kết thúc*</Form.Label>
                  <Form.Control type="date" min={form.voucherId ? form.startDate : [form.startDate, today()].filter(Boolean).sort().pop()} value={form.endDate} onChange={set("endDate")} required /></Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="bg-light border-0">
              <Button variant="secondary" onClick={() => setForm(null)} disabled={saving}>Hủy</Button>
              <Button type="submit" disabled={saving}>{form.voucherId ? "Lưu thay đổi" : "Tạo voucher"}</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </Container>
  );
}
