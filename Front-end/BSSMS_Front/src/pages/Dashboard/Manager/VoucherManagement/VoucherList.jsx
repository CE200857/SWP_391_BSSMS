import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Container, Table } from "react-bootstrap";
import { api, post, money, viDate } from "../../../../services/api";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";
import { StatusToggleButton, StatusChangeModal } from "../../../../components/StatusToggle";
import FloatingAlert from "../../../../components/FloatingAlert";
import CreateVoucherModal from "./CreateVoucherModal";
import UpdateVoucherModal from "./UpdateVoucherModal";
import DeleteVoucherModal from "./DeleteVoucherModal";

const statusMeta = {
  Active: { bg: "success", text: "Applying" },
  Inactive: { bg: "secondary", text: "Inactive" },
  Expired: { bg: "dark", text: "Expired" },
  UsedUp: { bg: "warning", text: "Used up" },
};
const value = (v) => (v.discountType === "Percent" ? `${Number(v.discountValue)}%` : money(v.discountValue));

export default function VoucherList() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Each CRUD action lives in its own modal file (Create/Update/DeleteVoucherModal.jsx)
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const afterChange = (message) => {
    setNotice(message);
    setShowCreate(false);
    setEditTarget(null);
    setDeleteTarget(null);
    load();
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
        {isManager && <Button className="fw-bold" onClick={() => setShowCreate(true)}><i className="bi bi-plus-lg me-1" /> Create voucher</Button>}
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
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setEditTarget(v)}><i className="bi bi-pencil-square" /> Edit</Button>
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => setDeleteTarget(v)}><i className="bi bi-trash" /> Delete</Button>
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

      <CreateVoucherModal show={showCreate} onClose={() => setShowCreate(false)} onSaved={afterChange} />
      <UpdateVoucherModal voucher={editTarget} onClose={() => setEditTarget(null)} onSaved={afterChange} />
      <DeleteVoucherModal voucher={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={afterChange} />

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
