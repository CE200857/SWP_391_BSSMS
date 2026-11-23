import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Container, Form, Modal, Spinner, Table } from "react-bootstrap";
import { api, put, money } from "../../../../services/api";
import "./MembershipManagementPage.css";
import FloatingAlert from "../../../../components/FloatingAlert";

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
      <h2 className="manager-page-title fw-bold mb-1">Benefits & membership tier</h2>
      <p className="text-muted mb-4">
        The tier is assigned automatically from the customer’s lifetime spending (successful payments minus refunds). The manager updates the benefit description shown to customers.
      </p>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark">
              <tr><th>Tier</th><th>Minimum spending</th><th>Discount</th><th>Benefit description</th><th>Customers</th>{isManager && <th className="text-center">Actions</th>}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-4"><Spinner animation="border" size="sm" /></td></tr> : tiers.map((t) => (
                <tr key={t.membershipTierId}>
                  <td className="fw-bold"><i className="bi bi-award text-danger me-1" />{t.tierName}</td>
                  <td>{money(t.minSpending)}</td>
                  <td><Badge bg="info">{Number(t.discountPercent)}%</Badge></td>
                  <td style={{ maxWidth: 420 }}>{t.description || <span className="text-muted">No description</span>}</td>
                  <td>{t.customerCount}<small className="text-muted d-block">{total ? Math.round((t.customerCount / total) * 100) : 0}% of customers</small></td>
                  {isManager && (
                    <td className="text-center">
                      <div className="manager-list-actions">
                        <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setEdit({ ...t, description: t.description || "" })}>
                          <i className="bi bi-pencil-square" /> Edit description
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
        <Modal.Header closeButton><Modal.Title>Tier benefits {edit?.tierName}</Modal.Title></Modal.Header>
        {edit && (
          <Modal.Body>
            <p className="text-muted small">Spending from {money(edit.minSpending)} · discount {Number(edit.discountPercent)}% for services and treatment packages.</p>
            <Form.Control as="textarea" rows={4} maxLength={500} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <Form.Text>{edit.description.length}/500 characters</Form.Text>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEdit(null)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>Save</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
