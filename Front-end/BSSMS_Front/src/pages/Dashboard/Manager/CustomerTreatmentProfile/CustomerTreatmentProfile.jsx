import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Modal, ProgressBar, Row, Spinner, Table } from "react-bootstrap";
import { api, post, money, viDate, time5, label, today } from "../../../../services/api";

const pkgBg = { Active: "success", Completed: "secondary", Expired: "dark", Cancelled: "danger" };

function PackageCards({ packages, onBook }) {
  if (!packages.length) return <p className="text-muted mb-0">Chưa có gói liệu trình.</p>;
  return (
    <Row className="g-3">
      {packages.map((p) => {
        const booked = (p.usage || []).filter((u) => u.status !== "Done").length;
        const available = Math.max(0, Number(p.remainingSessions) - booked);
        const total = Number(p.totalSessions);
        return (
        <Col md={6} key={p.customerPackageId}>
          <Card className="h-100 border">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <strong>{p.packageName}</strong>
                <Badge bg={pkgBg[p.status]}>{label(p.status)}</Badge>
              </div>
              <ProgressBar className="my-2" style={{ height: 8 }}>
                <ProgressBar variant="danger" now={((total - Number(p.remainingSessions)) / total) * 100} key="used" />
                <ProgressBar variant="warning" now={(booked / total) * 100} key="booked" />
              </ProgressBar>
              <small className="d-block">
                Còn <strong>{available}</strong>/{total} buổi có thể đặt
                {booked > 0 && <> · <strong>{booked}</strong> buổi đã đặt lịch</>}
                {" · "}Hạn dùng {viDate(p.expiryDate)}
              </small>
              <small className="d-block text-muted">
                Đã dùng {total - Number(p.remainingSessions)} buổi · Mua {viDate(p.purchaseDate)} · {money(p.purchasePrice)}{p.soldBy ? ` · ${p.soldBy}` : ""}
              </small>
              {p.usage?.length > 0 && (
                <ul className="small mt-2 mb-0 ps-3">
                  {p.usage.map((u) => (
                    <li key={u.appointmentServiceId}>{viDate(u.appointmentDate)} {time5(u.startTime)} · {u.serviceName} · {label(u.status)}{u.technicianName ? ` · ${u.technicianName}` : ""}</li>
                  ))}
                </ul>
              )}
              {onBook && p.status === "Active" && available > 0 && String(p.expiryDate).slice(0, 10) >= today() && (
                <Button size="sm" className="mt-2" onClick={() => onBook(p)}>Đặt lịch dùng gói</Button>
              )}
            </Card.Body>
          </Card>
        </Col>
        );
      })}
    </Row>
  );
}

function CustomerView() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/customer-packages").then(setPackages).catch((e) => setError(e.message)); }, []);
  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Liệu trình của tôi</h2>
          <p className="text-muted mb-0">Số buổi còn lại, hạn dùng và các buổi đã sử dụng.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => navigate("/treatment-packages")}>Mua gói mới</Button>
          <Button onClick={() => navigate("/appointments/online")}>Đặt lịch</Button>
        </div>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {!packages && !error ? <Spinner animation="border" variant="danger" /> : packages && <PackageCards packages={packages} onBook={(p) => navigate("/appointments/online", { state: { customerPackageId: p.customerPackageId } })} />}
    </Container>
  );
}

function StaffView({ role }) {
  const { customerId: routeId } = useParams();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(routeId ? Number(routeId) : null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [health, setHealth] = useState(null);
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState(null);
  const canEditHealth = role === "Receptionist" || role === "Manager";

  useEffect(() => { api("/api/treatment-profiles").then(setCustomers).catch((e) => setError(e.message)); }, []);
  const load = useCallback(async () => {
    if (!selected) return;
    try {
      const [s, h, p] = await Promise.all([
        api(`/api/treatment-profiles?customerId=${selected}&action=summary`),
        api(`/api/treatment-profiles?customerId=${selected}&action=history`),
        api(`/api/customer-packages/${selected}`).catch(() => []),
      ]);
      setSummary(s);
      setHistory(h);
      setPackages(p);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, [selected]);
  useEffect(() => { setSummary(null); load(); }, [load]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => !q || `${c.customerName} ${c.phone}`.toLowerCase().includes(q)).slice(0, 50);
  }, [customers, search]);

  const saveHealth = async () => {
    setSaving(true);
    try {
      const r = await post("/api/treatment-profiles", { action: "update-health", customerId: selected, ...health });
      setNotice(r.message || "Đã cập nhật hồ sơ sức khỏe.");
      setHealth(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };
  const openPhotos = async (line) => {
    setPhotos({ line, list: null });
    try {
      setPhotos({ line, list: await api(`/api/treatment-photos/${line.appointmentServiceId}`) });
    } catch (e) {
      setError(e.message);
      setPhotos(null);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="manager-page-title fw-bold mb-1">Hồ sơ & liệu trình khách hàng</h2>
      <p className="text-muted mb-4">Hồ sơ sức khỏe, lịch sử điều trị và gói liệu trình của khách.</p>
      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
      {notice && <Alert variant="success" dismissible onClose={() => setNotice("")}>{notice}</Alert>}
      <Row className="g-4">
        <Col lg={3}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Form.Control placeholder="Tìm khách hàng..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
              <ListGroup variant="flush" style={{ maxHeight: 520, overflowY: "auto" }}>
                {matches.map((c) => (
                  <ListGroup.Item action key={c.customerId} active={c.customerId === selected} onClick={() => setSelected(c.customerId)}>
                    <strong>{c.customerName}</strong>
                    <small className="d-block">{c.phone}{c.lastVisit ? ` · ghé ${viDate(c.lastVisit)}` : ""}</small>
                  </ListGroup.Item>
                ))}
                {!matches.length && <p className="text-muted small mb-0">Không có khách hàng.</p>}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={9}>
          {!selected ? <Alert variant="light">Chọn khách hàng để xem hồ sơ.</Alert> : !summary ? <Spinner animation="border" variant="danger" /> : (
            <>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <div>
                      <h4 className="fw-bold mb-1">{summary.fullName} <Badge bg="info">{summary.tierName}</Badge></h4>
                      <small className="text-muted">{summary.phone}{summary.email ? ` · ${summary.email}` : ""}{summary.dateOfBirth ? ` · sinh ${viDate(summary.dateOfBirth)}` : ""}</small>
                    </div>
                    <div className="d-flex gap-2">
                      {role === "Receptionist" && <Button variant="outline-primary" size="sm" onClick={() => navigate("/sell-treatment-package")}>Bán gói</Button>}
                      {canEditHealth && <Button size="sm" onClick={() => setHealth({ skinCondition: summary.skinCondition || "", allergies: summary.allergies || "", notes: summary.notes || "" })}>Cập nhật hồ sơ sức khỏe</Button>}
                    </div>
                  </div>
                  <Row className="mt-3 g-3">
                    <Col md={4}><small className="text-muted d-block">Tình trạng da</small>{summary.skinCondition || "—"}</Col>
                    <Col md={4}><small className="text-muted d-block">Dị ứng</small><span className={summary.allergies ? "text-danger fw-semibold" : ""}>{summary.allergies || "Không"}</span></Col>
                    <Col md={4}><small className="text-muted d-block">Ghi chú</small>{summary.notes || "—"}</Col>
                  </Row>
                  <Row className="mt-3 text-center g-2">
                    {[["Lịch hẹn", summary.totalAppointments], ["Hoàn thành", summary.completedAppointments], ["Sắp tới", summary.upcomingAppointments], ["Gói đang dùng", summary.activePackages], ["Buổi còn lại", summary.totalRemainingSessions], ["Chi tiêu", money(summary.lifetimeSpending)]].map(([t, v]) => (
                      <Col key={t} xs={4} md={2}><div className="border rounded p-2"><small className="text-muted d-block">{t}</small><strong>{v}</strong></div></Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>

              <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white fw-bold">Gói liệu trình</Card.Header>
                <Card.Body><PackageCards packages={packages} /></Card.Body>
              </Card>

              <Card className="shadow-sm border-0">
                <Card.Header className="bg-white fw-bold">Lịch sử điều trị</Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="align-middle mb-0 manager-list-table">
                    <thead className="table-light"><tr><th>Ngày</th><th>Dịch vụ</th><th>KTV</th><th>Kết quả</th><th>Phản ứng da</th><th>Ảnh</th></tr></thead>
                    <tbody>
                      {history.map((h) => (
                        <tr key={h.appointmentServiceId}>
                          <td>{viDate(h.appointmentDate)}<small className="d-block text-muted">{time5(h.startTime)} · #{h.appointmentId}</small></td>
                          <td>{h.serviceName}</td>
                          <td>{h.technicianName || "—"}</td>
                          <td style={{ maxWidth: 280 }}>{h.resultNotes || <span className="text-muted">Chưa ghi</span>}</td>
                          <td>{h.skinReaction || "—"}</td>
                          <td>{Number(h.photoCount) > 0 ? <Button size="sm" variant="link" onClick={() => openPhotos(h)}>{h.photoCount} ảnh</Button> : "—"}</td>
                        </tr>
                      ))}
                      {!history.length && <tr><td colSpan={6} className="text-center text-muted py-3">Chưa có dịch vụ hoàn thành.</td></tr>}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      <Modal show={!!health} onHide={() => !saving && setHealth(null)} centered>
        <Modal.Header closeButton><Modal.Title>Hồ sơ sức khỏe</Modal.Title></Modal.Header>
        {health && (
          <Modal.Body>
            {[["skinCondition", "Tình trạng da"], ["allergies", "Dị ứng"], ["notes", "Ghi chú"]].map(([k, t]) => (
              <Form.Group key={k} className="mb-3">
                <Form.Label>{t}</Form.Label>
                <Form.Control as="textarea" rows={2} maxLength={1000} value={health[k]} onChange={(e) => setHealth({ ...health, [k]: e.target.value })} />
              </Form.Group>
            ))}
          </Modal.Body>
        )}
        <Modal.Footer><Button variant="secondary" onClick={() => setHealth(null)}>Hủy</Button><Button disabled={saving} onClick={saveHealth}>Lưu</Button></Modal.Footer>
      </Modal>

      <Modal show={!!photos} onHide={() => setPhotos(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Ảnh trước/sau · {photos?.line.serviceName}</Modal.Title></Modal.Header>
        <Modal.Body className="d-flex flex-wrap gap-3">
          {!photos?.list ? <Spinner animation="border" size="sm" /> : photos.list.map((p) => (
            <figure key={p.photoId} className="text-center mb-0">
              <img src={`/api/treatment-photos/file/${p.photoId}`} alt={p.photoType} style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 8 }} />
              <figcaption className="small">{p.photoType === "Before" ? "Trước" : "Sau"}</figcaption>
            </figure>
          ))}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default function CustomerTreatmentProfile() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.role === "Customer" ? <CustomerView /> : <StaffView role={user?.role} />;
}
