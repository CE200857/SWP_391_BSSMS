import { useCallback, useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Container, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, put, money } from "../../../../services/api";
import "./MembershipManagementPage.css";

export default function MembershipManagementPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTiers(await api("/api/membership-tiers"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const r = await put(`/api/membership-tiers?id=${edit.membershipTierId}`, { description: edit.description });
      setNotice(r.message);
      setEdit(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const total = tiers.reduce((n, t) => n + Number(t.customerCount || 0), 0);

  return (
    <Container fluid className="mt-4 px-4 membership-management-page">
      <h2 className="manager-page-title fw-bold mb-1">Quyền lợi & hạng thành viên</h2>
      <p className="text-muted mb-4">
        Hạng được xét tự động theo chi tiêu trọn đời của khách (thanh toán thành công trừ hoàn tiền). Quản lý cập nhật mô tả quyền lợi hiển thị cho khách.
      </p>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark">
              <tr><th>Hạng</th><th>Chi tiêu tối thiểu</th><th>Giảm giá</th><th>Mô tả quyền lợi</th><th>Số khách</th>{isManager && <th className="text-center">Hành động</th>}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-4"><Spinner animation="border" size="sm" /></td></tr> : tiers.map((t) => (
                <tr key={t.membershipTierId}>
                  <td className="fw-bold"><i className="bi bi-award text-danger me-1" />{t.tierName}</td>
                  <td>{money(t.minSpending)}</td>
                  <td><Badge bg="info">{Number(t.discountPercent)}%</Badge></td>
                  <td style={{ maxWidth: 420 }}>{t.description || <span className="text-muted">Chưa có mô tả</span>}</td>
                  <td>{t.customerCount}<small className="text-muted d-block">{total ? Math.round((t.customerCount / total) * 100) : 0}% khách hàng</small></td>
                  {isManager && (
                    <td className="text-center">
                      <div className="manager-list-actions">
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setEdit({ ...t, description: t.description || "" })}>
                          <i className="bi bi-pencil-square" /> Sửa mô tả
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={!!edit} onHide={() => !saving && setEdit(null)} centered>
        <Modal.Header closeButton><Modal.Title>Quyền lợi hạng {edit?.tierName}</Modal.Title></Modal.Header>
        {edit && (
          <Modal.Body>
            <p className="text-muted small">Chi tiêu từ {money(edit.minSpending)} · giảm {Number(edit.discountPercent)}% cho dịch vụ và gói liệu trình.</p>
            <Form.Control as="textarea" rows={4} maxLength={500} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <Form.Text>{edit.description.length}/500 ký tự</Form.Text>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEdit(null)} disabled={saving}>Hủy</Button>
          <Button onClick={save} disabled={saving}>Lưu</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
