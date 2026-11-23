import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Container, Form, ListGroup, Modal, ProgressBar, Row, Spinner, Table } from "react-bootstrap";
import { api, post, money, viDate, time5, label, today } from "../../../../services/api";
import FloatingAlert from "../../../../components/FloatingAlert";

const pkgBg = { Active: "success", Completed: "secondary", Expired: "dark", Cancelled: "danger" };
const initials = (name = "") => name.trim().split(/\s+/).slice(-1)[0]?.[0]?.toUpperCase() || "?";
const hasAllergy = (v) => v && !/^(none|no|không|khong|n\/a|-)$/i.test(String(v).trim());

const pkgOrder = { Active: 0, Completed: 1, Expired: 2, Cancelled: 3 };

// Counts sessions UP (used / total), same as the customer's "My packages" page
function PackageCards({ packages, onBook }) {
  if (!packages.length) return <p className="text-muted mb-0">No treatment packages.</p>;
  const sorted = [...packages].sort((a, b) => (pkgOrder[a.status] ?? 9) - (pkgOrder[b.status] ?? 9) || String(b.purchaseDate).localeCompare(String(a.purchaseDate)));
  return (
    <div className="ctp-packages">
      {sorted.map((p) => {
        const total = Number(p.totalSessions) || 0;
        const used = Math.max(0, total - Number(p.remainingSessions));
        const booked = (p.usage || []).filter((u) => u.status !== "Done").length;
        const available = Math.max(0, Number(p.remainingSessions) - booked);
        const active = p.status === "Active";
        const last = (p.usage || []).filter((u) => u.status === "Done").slice(-1)[0];
        return (
          <article key={p.customerPackageId} className={`ctp-pkg${active ? "" : " ctp-pkg--off"}`}>
            <div className="ctp-pkg-head">
              <strong>{p.packageName}</strong>
              <span className={`ctp-pkg-status ctp-pkg-status--${p.status}`}>{label(p.status)}</span>
            </div>
            <div className="ctp-pkg-count">
              <strong>{used}</strong> / {total} sessions used
              <span> · {available} left{booked > 0 ? ` · ${booked} booked` : ""}</span>
            </div>
            <div className="ctp-pkg-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={used} aria-label={`${used} of ${total} sessions used`}>
              <span style={{ width: `${total ? (used / total) * 100 : 0}%` }} />
              {booked > 0 && <span className="ctp-pkg-bar-booked" style={{ width: `${(booked / total) * 100}%` }} />}
            </div>
            <div className="ctp-pkg-meta">
              <span>{active ? "Valid until" : "Expired on"} {viDate(p.expiryDate)}</span>
              <span>Bought {viDate(p.purchaseDate)} · {money(p.purchasePrice)}{p.soldBy ? ` · ${p.soldBy}` : ""}</span>
              {last && <span>Last session {viDate(last.appointmentDate)} · {last.serviceName}{last.technicianName ? ` · ${last.technicianName}` : ""}</span>}
            </div>
            {onBook && active && available > 0 && String(p.expiryDate).slice(0, 10) >= today() && (
              <Button size="sm" className="mt-2" onClick={() => onBook(p)}>Book with a package</Button>
            )}
          </article>
        );
      })}
    </div>
  );
}

// Same illustration per service as the Services page
const servicePhoto = (serviceId) => {
  const no = String((Math.max(1, Number(serviceId) || 1) - 1) % 11 + 1).padStart(2, "0");
  return new URL(`../../../../assets/figma/service-card-exact-${no}.png`, import.meta.url).href;
};

function CustomerView() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState(null);
  const [catalog, setCatalog] = useState({});
  const [error, setError] = useState("");
  const [tab, setTab] = useState("active");

  useEffect(() => {
    api("/api/customer-packages").then(setPackages).catch((e) => setError(e.message));
    api("/api/treatment-packages")
      .then((rows) => setCatalog(Object.fromEntries((rows || []).map((t) => [t.treatmentPackageId, t]))))
      .catch(() => setCatalog({}));
  }, []);

  const rows = (packages || []).map((p) => {
    const total = Number(p.totalSessions) || 0;
    const remaining = Number(p.remainingSessions) || 0;
    const upcoming = (p.usage || []).filter((u) => u.status !== "Done");
    const available = Math.max(0, remaining - upcoming.length);
    const used = Math.max(0, total - remaining);
    const usable = p.status === "Active" && String(p.expiryDate).slice(0, 10) >= today();
    const daysLeft = Math.ceil((new Date(`${String(p.expiryDate).slice(0, 10)}T00:00:00`) - new Date(`${today()}T00:00:00`)) / 86400000);
    const info = catalog[p.treatmentPackageId];
    return { ...p, total, remaining, used, upcoming, available, usable, daysLeft, info };
  });
  const active = rows.filter((p) => p.usable).sort((x, y) => String(x.expiryDate).localeCompare(String(y.expiryDate)));
  const past = rows.filter((p) => !p.usable).sort((x, y) => String(y.purchaseDate).localeCompare(String(x.purchaseDate)));
  const shown = tab === "active" ? active : past;
  const pastLabel = (p) => (p.remaining === 0 ? "Used up" : p.status === "Cancelled" ? "Cancelled" : "Expired");

  return (
    <div className="sc-page">
      <section className="customer-page-banner">
        <div className="customer-page-container">
          <div className="customer-breadcrumb">
            <span>Home</span><i className="bi bi-chevron-right" aria-hidden="true" />
            <strong>My packages</strong>
          </div>
          <div className="customer-banner-content">
            <div>
              <span className="seoul-eyebrow">YOUR TREATMENT PACKAGES</span>
              <h1>My packages</h1>
              <p>Sessions left and expiry dates for the packages you bought.</p>
            </div>
            <button type="button" className="sc-btn sc-btn-ghost" onClick={() => navigate("/treatment-packages")}>
              Buy a new package
            </button>
          </div>
        </div>
      </section>

      <section className="sc-container sc-mp">
        <div className="sc-mp-tabs" role="tablist" aria-label="Packages">
          {[["active", `In use (${active.length})`], ["past", `Used up & expired (${past.length})`]].map(([key, text]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key}
              className={`sc-mp-tab${tab === key ? " is-active" : ""}`} onClick={() => setTab(key)}>
              {text}
            </button>
          ))}
        </div>

        <FloatingAlert message={error} onClose={() => setError("")} />

        {!packages && !error ? (
          <p className="sc-muted py-4"><Spinner animation="border" size="sm" /> Loading your packages…</p>
        ) : packages && shown.length === 0 ? (
          <div className="sc-mp-empty">
            <p>{tab === "active" ? "You don’t have any packages in use." : "No used up or expired packages."}</p>
            {tab === "active" && (
              <button type="button" className="sc-btn sc-btn-primary" onClick={() => navigate("/treatment-packages")}>See packages</button>
            )}
          </div>
        ) : packages && (
          <ul className="sc-mp-list">
            {shown.map((p) => {
              const serviceId = p.info?.serviceIds?.[0];
              const services = (p.info?.services || []).map((s) => s.serviceName).join(", ");
              // Count up: the bar fills as sessions are used
              const pct = p.total ? Math.round((p.used / p.total) * 100) : 0;
              return (
                <li key={p.customerPackageId} className={`sc-mp-row${p.usable ? "" : " is-past"}`}>
                  <img src={servicePhoto(serviceId)} alt="" loading="lazy" />
                  <div className="sc-mp-info">
                    <h2>{p.packageName}</h2>
                    {services && <p className="sc-mp-services">{services}</p>}
                    <p className="sc-mp-meta">Bought {viDate(p.purchaseDate)} · {money(p.purchasePrice)}</p>
                  </div>
                  <div className="sc-mp-sessions">
                    <p><strong>{p.used}</strong> / {p.total} sessions used <span className="sc-mp-left">· {p.remaining} left</span></p>
                    <div className="sc-mp-bar" role="img" aria-label={`${p.used} of ${p.total} sessions used`}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    {p.usable ? (
                      <p className={p.daysLeft <= 14 ? "sc-mp-expiry is-soon" : "sc-mp-expiry"}>
                        {p.daysLeft <= 14 ? `Expires in ${p.daysLeft} day${p.daysLeft === 1 ? "" : "s"} · ${viDate(p.expiryDate)}` : `Valid until ${viDate(p.expiryDate)}`}
                      </p>
                    ) : (
                      <p className="sc-mp-expiry">{pastLabel(p)} · {viDate(p.expiryDate)}</p>
                    )}
                    {p.upcoming.length > 0 && (
                      <p className="sc-mp-next">
                        Next visit {viDate(p.upcoming[0].appointmentDate)}, {time5(p.upcoming[0].startTime)}
                        {p.upcoming.length > 1 ? ` (+${p.upcoming.length - 1} more booked)` : ""}
                      </p>
                    )}
                  </div>
                  <div className="sc-mp-action">
                    {p.usable && p.available > 0 ? (
                      <button type="button" className="sc-btn sc-btn-primary"
                        onClick={() => navigate("/appointments/online", { state: { customerPackageId: p.customerPackageId } })}>
                        Book a session
                      </button>
                    ) : p.usable ? (
                      <span className="sc-muted sc-small">All sessions booked</span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
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
      setNotice(r.message || "Skin profile updated.");
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
    <Container fluid className="mt-4 px-4 ctp-page">
      <h2 className="manager-page-title fw-bold mb-1">Customer care profiles</h2>
      <p className="text-muted mb-4">Skin notes, care history and treatment packages of each customer.</p>
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />
      <div className="ctp-layout">
        <aside className="ctp-side">
          <div className="ctp-side-head">
            <span>Customers</span>
            <small>{customers.length}</small>
          </div>
          <div className="ctp-search">
            <i className="bi bi-search" aria-hidden="true" />
            <input type="search" placeholder="Name or phone" aria-label="Search customers" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="ctp-people">
            {matches.map((c) => (
              <button type="button" key={c.customerId} className={`ctp-person${c.customerId === selected ? " is-active" : ""}`} aria-pressed={c.customerId === selected} onClick={() => setSelected(c.customerId)}>
                <span className="ctp-avatar" aria-hidden="true">{initials(c.customerName)}</span>
                <span className="ctp-person-text">
                  <strong>{c.customerName}</strong>
                  <small>{c.phone}{c.lastVisit ? ` · ${viDate(c.lastVisit)}` : ""}</small>
                </span>
              </button>
            ))}
            {!matches.length && <p className="text-muted small mb-0 px-2">No customers found.</p>}
          </div>
        </aside>

        <div className="ctp-main">
          {!selected ? (
            <div className="ctp-empty"><i className="bi bi-person-heart" aria-hidden="true" /><p>Select a customer to see their care profile.</p></div>
          ) : !summary ? (
            <div className="ctp-empty"><Spinner animation="border" variant="danger" /></div>
          ) : (
            <>
              <section className="ctp-card ctp-hero">
                <div className="ctp-hero-top">
                  <span className="ctp-avatar ctp-avatar--lg" aria-hidden="true">{initials(summary.fullName)}</span>
                  <div className="ctp-hero-name">
                    <h3>{summary.fullName} {summary.tierName && <span className="ctp-tier">{summary.tierName}</span>}</h3>
                    <p>
                      <span><i className="bi bi-telephone" aria-hidden="true" /> {summary.phone}</span>
                      {summary.email && <span><i className="bi bi-envelope" aria-hidden="true" /> {summary.email}</span>}
                      {summary.dateOfBirth && <span><i className="bi bi-gift" aria-hidden="true" /> {viDate(summary.dateOfBirth)}</span>}
                    </p>
                  </div>
                  <div className="ctp-hero-actions">
                    {canEditHealth && <Button variant="outline-primary" onClick={() => navigate("/sell-treatment-package")}><i className="bi bi-bag-plus" aria-hidden="true" /> Sell package</Button>}
                    {canEditHealth && <Button onClick={() => setHealth({ skinCondition: summary.skinCondition || "", allergies: summary.allergies || "", notes: summary.notes || "" })}><i className="bi bi-pencil-square" aria-hidden="true" /> Edit skin profile</Button>}
                  </div>
                </div>

                <div className="ctp-notes">
                  <div className="ctp-note">
                    <span><i className="bi bi-droplet" aria-hidden="true" /> Skin condition</span>
                    <p>{summary.skinCondition || "Not recorded"}</p>
                  </div>
                  <div className={`ctp-note${hasAllergy(summary.allergies) ? " ctp-note--alert" : ""}`}>
                    <span><i className="bi bi-exclamation-triangle" aria-hidden="true" /> Allergies</span>
                    <p>{hasAllergy(summary.allergies) ? summary.allergies : "None"}</p>
                  </div>
                  <div className="ctp-note">
                    <span><i className="bi bi-chat-heart" aria-hidden="true" /> Preferences & notes</span>
                    <p>{summary.notes || "—"}</p>
                  </div>
                </div>

                <dl className="ctp-stats">
                  {[["Visits", summary.totalAppointments], ["Completed", summary.completedAppointments], ["Upcoming", summary.upcomingAppointments], ["Packages", summary.activePackages], ["Sessions left", summary.totalRemainingSessions], ["Total spent", money(summary.lifetimeSpending)]].map(([t, v]) => (
                    <div key={t}><dt>{t}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
              </section>

              <section className="ctp-card">
                <header className="ctp-card-head"><h4>Treatment packages</h4><span>{packages.length}</span></header>
                <PackageCards packages={packages} />
              </section>

              <section className="ctp-card">
                <header className="ctp-card-head"><h4>Care history</h4><span>{history.length}</span></header>
                {history.length ? (
                  <div className="table-responsive">
                    <table className="ctp-history">
                      <thead><tr><th>Date</th><th>Service</th><th>Technician</th><th>Notes</th><th>Skin reaction</th><th>Photos</th></tr></thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.appointmentServiceId}>
                            <td><strong>{viDate(h.appointmentDate)}</strong><small>{time5(h.startTime)}</small></td>
                            <td>{h.serviceName}</td>
                            <td>{h.technicianName || "—"}</td>
                            <td className="ctp-history-notes">{h.resultNotes || <span className="text-muted">Not recorded yet</span>}</td>
                            <td>{h.skinReaction || "—"}</td>
                            <td>{Number(h.photoCount) > 0 ? (
                              <button type="button" className="ctp-photo-btn" onClick={() => openPhotos(h)}><i className="bi bi-images" aria-hidden="true" /> {h.photoCount}</button>
                            ) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted mb-0">No completed services yet.</p>}
              </section>
            </>
          )}
        </div>
      </div>

      <Modal show={!!health} onHide={() => !saving && setHealth(null)} centered>
        <Modal.Header closeButton><Modal.Title>Skin profile</Modal.Title></Modal.Header>
        {health && (
          <Modal.Body>
            {[["skinCondition", "Skin condition"], ["allergies", "Allergies"], ["notes", "Notes"]].map(([k, t]) => (
              <Form.Group key={k} className="mb-3">
                <Form.Label>{t}</Form.Label>
                <Form.Control as="textarea" rows={2} maxLength={1000} value={health[k]} onChange={(e) => setHealth({ ...health, [k]: e.target.value })} />
              </Form.Group>
            ))}
          </Modal.Body>
        )}
        <Modal.Footer><Button variant="outline-secondary" onClick={() => setHealth(null)}>Cancel</Button><Button disabled={saving} onClick={saveHealth}>Save</Button></Modal.Footer>
      </Modal>

      <Modal show={!!photos} onHide={() => setPhotos(null)} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Before/after photos · {photos?.line.serviceName}</Modal.Title></Modal.Header>
        <Modal.Body className="d-flex flex-wrap gap-3">
          {!photos?.list ? <Spinner animation="border" size="sm" /> : photos.list.map((p) => (
            <figure key={p.photoId} className="text-center mb-0">
              <img src={`/api/treatment-photos/file/${p.photoId}`} alt={p.photoType} style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 8 }} />
              <figcaption className="small">{p.photoType === "Before" ? "Before" : "Sau"}</figcaption>
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
