import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Table,
    Button,
    Modal,
    Form
} from "react-bootstrap";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { setAppointmentStatus } from "../../../utils/appointmentActions";

const AppointmentList = ({ user, setUser }) => {
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");
    const [customerTab, setCustomerTab] = useState("upcoming");
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");
    const [loadError, setLoadError] = useState("");
    const navigate = useNavigate();

    const isManagerOrReceptionist = user?.role === "Manager" || user?.role === "Receptionist";
    const { filteredRows: managerFilteredAppointments, toolbar } = useManagerSearchFilter(
        appointments,
        [
            { key: "appointmentId", label: "Appointment ID", filterable: false },
            { key: "customerName", label: "Customer" },
            { key: "customerPhone", label: "Phone number", filterable: false },
            { key: "technicianNames", label: "Technician" },
            { key: "serviceNames", label: "Service", filterable: false },
            { key: "invoiceStatus", label: "Invoice" },
            { key: "status", label: "Status" },
            { key: "appointmentDate", label: "Appointment date", type: "date" },
        ],
        "Search by customer, staff, service, room...",
    );

    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const [approvingId, setApprovingId] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const fetchAppointments = async () => {
            setLoading(true);
            setLoadError("");
            setSessionExpired(false);
            try {
                const response = await fetch("/api/appointments", {
                    credentials: "include",
                    signal: controller.signal,
                });
                if (response.status === 401) {
                    setSessionExpired(true);
                    throw new Error("Your session has expired. Please log in again.");
                }
                if (response.status === 403) throw new Error("You do not have permission to view the appointment list.");
                if (response.status === 404) throw new Error("The appointment API was not found (HTTP 404). Please check the running back-end version.");
                if (!response.ok) throw new Error(`The server could not load appointments (HTTP ${response.status}). Please try again or check the back-end log.`);
                const type = response.headers.get("content-type") || "";
                if (!type.includes("application/json")) throw new Error("The appointment API returned data in an unexpected format. Please check the back-end URL.");
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error("Appointment data is not a list.");
                if (!controller.signal.aborted) setAppointments(data);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setAppointments([]);
                    setLoadError(error instanceof TypeError
                        ? "Could not connect to the server. Please check that the back-end is running and try again."
                        : error.message);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        fetchAppointments();
        return () => controller.abort();
    }, [attempt, user?.accountId]);

    const loginAgain = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate(user?.role === "Customer" ? "/login" : "/dashboard/login", {
            replace: true, state: { from: "/appointments" },
        });
    };
    const errorPanel = loadError && (
        <div className="alert alert-danger" role="alert">
            <p>{loadError}</p>
            <Button onClick={sessionExpired ? loginAgain : () => setAttempt(value => value + 1)}>
                {sessionExpired ? "Log in again" : "Try again"}
            </Button>
        </div>
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredCustomerAppointments = appointments.filter((appointment) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch = !query ||
            appointment.customerName?.toLowerCase().includes(query) ||
            appointment.technicianNames?.toLowerCase().includes(query) ||
            appointment.serviceNames?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
        const dateValue = String(appointment.appointmentDate || "").slice(0, 10);
        const date = new Date(`${dateValue}T00:00:00`);
        const isPast = !Number.isNaN(date.getTime()) && date < today;
        const matchesTime = timeFilter === "all" ||
            (timeFilter === "upcoming" && !isPast) ||
            (timeFilter === "past" && isPast);
        return matchesSearch && matchesStatus && matchesTime;
    });
    const filteredAppointments = [...(user?.role === "Customer"
        ? filteredCustomerAppointments
        : managerFilteredAppointments)].sort((a, b) => Number(b.appointmentId) - Number(a.appointmentId));

    const formatAppointmentDate = (value) => {
        const dateValue = String(value || "").slice(0, 10);
        const date = new Date(`${dateValue}T00:00:00`);
        return Number.isNaN(date.getTime())
            ? value
            : new Intl.DateTimeFormat("vi-VN").format(date);
    };

    const approve = async (appointmentId) => {
        setApprovingId(appointmentId);
        try {
            await setAppointmentStatus(appointmentId, "Confirmed");
            setAttempt((value) => value + 1);
        } catch (error) {
            alert(error.message);
        } finally {
            setApprovingId(null);
        }
    };

    const markNoShow = async (appointmentId) => {
        if (!window.confirm(`Mark appointment #${appointmentId} as a no-show? Unpaid invoices will be cancelled.`)) return;
        setApprovingId(appointmentId);
        try {
            await setAppointmentStatus(appointmentId, "No-show");
            setAttempt((value) => value + 1);
        } catch (error) {
            alert(error.message);
        } finally {
            setApprovingId(null);
        }
    };

    const getStatusBadge = (status) => <AppointmentStatusBadge status={status} />;

    if (user?.role === "Customer") {
        const TABS = [
            { key: "upcoming", label: "Upcoming", statuses: ["Pending", "Confirmed", "Checked-in", "In-progress"] },
            { key: "past", label: "Past", statuses: ["Completed", "No-show"] },
            { key: "cancelled", label: "Cancelled", statuses: ["Cancelled"] },
        ];
        const when = (a) => `${String(a.appointmentDate || "").slice(0, 10)} ${String(a.startTime || "").slice(0, 5)}`;
        const query = searchTerm.trim().toLowerCase();
        const tabRows = (key) => {
            const tab = TABS.find((t) => t.key === key);
            return appointments
                .filter((a) => tab.statuses.includes(a.status))
                .filter((a) => !query || `${a.serviceNames} ${a.technicianNames}`.toLowerCase().includes(query))
                .sort((x, y) => (key === "upcoming" ? when(x).localeCompare(when(y)) : when(y).localeCompare(when(x))));
        };
        const rows = tabRows(customerTab);
        const dateParts = (value) => {
            const date = new Date(`${String(value || "").slice(0, 10)}T00:00:00`);
            if (Number.isNaN(date.getTime())) return { day: "—", month: "", weekday: "" };
            return {
                day: String(date.getDate()).padStart(2, "0"),
                month: date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
                weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
            };
        };
        const time = (a) => `${String(a.startTime || "").slice(0, 5)}–${String(a.endTime || "").slice(0, 5)}`;
        const payment = (a) => (a.invoiceStatus === "Paid" ? "Paid" : a.paymentChoice === "Online" ? "VNPay" : "Pay at the counter");
        // Customers may reschedule or cancel Pending/Confirmed visits until 2 hours before the start time
        const changeable = (a) => {
            if (!["Pending", "Confirmed"].includes(a.status)) return false;
            const start = new Date(`${String(a.appointmentDate).slice(0, 10)}T${String(a.startTime || "00:00").slice(0, 5)}:00`);
            return start.getTime() - Date.now() >= 2 * 60 * 60 * 1000;
        };
        const canPay = (a) => ["Pending", "Confirmed"].includes(a.status) && a.invoiceStatus === "Unpaid" && Number(a.totalAmount) > 0;
        const recent = appointments
            .filter((a) => a.status === "Completed")
            .sort((x, y) => when(y).localeCompare(when(x)))
            .slice(0, 3);
        const confirmCancel = async (event) => {
            event.preventDefault();
            setCancelling(true);
            setCancelError("");
            try {
                await setAppointmentStatus(cancelTarget.appointmentId, "Cancelled", cancelReason.trim());
                setCancelTarget(null);
                setAttempt((value) => value + 1);
            } catch (e) {
                setCancelError(e.message);
            } finally {
                setCancelling(false);
            }
        };

        return (
            <div className="sc-page">
                <section className="customer-page-banner">
                    <div className="customer-page-container">
                        <div className="customer-breadcrumb">
                            <span>Home</span><i className="bi bi-chevron-right" aria-hidden="true" />
                            <strong>My Appointments</strong>
                        </div>
                        <div className="customer-banner-content">
                            <div>
                                <span className="seoul-eyebrow">YOUR CARE JOURNEY</span>
                                <h1>My Appointments</h1>
                                <p>Track upcoming visits, view details and leave a review after each treatment.</p>
                            </div>
                            <div className="customer-summary-card">
                                <span><i className="bi bi-calendar2-check" aria-hidden="true" /> Upcoming</span>
                                <strong>{String(tabRows("upcoming").length).padStart(2, "0")}</strong>
                                <small>appointments</small>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="sc-container sc-toolbar">
                    <div className="sc-tabs" role="tablist" aria-label="Appointments">
                        {TABS.map((t) => (
                            <button
                                type="button"
                                role="tab"
                                key={t.key}
                                aria-selected={customerTab === t.key}
                                className={`sc-tab${customerTab === t.key ? " is-active" : ""}`}
                                onClick={() => setCustomerTab(t.key)}
                            >
                                {t.label} <span className="sc-tab-count">{tabRows(t.key).length}</span>
                            </button>
                        ))}
                    </div>
                    <label className="sc-search">
                        <i className="bi bi-search" aria-hidden="true" />
                        <span className="visually-hidden">Search appointments</span>
                        <input type="search" placeholder="Search service or therapist" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </label>
                </section>

                <section className="sc-container sc-section-tight">
                    {loading ? (
                        <div className="sc-empty" role="status">Loading appointments…</div>
                    ) : loadError ? errorPanel : rows.length === 0 ? (
                        <div className="sc-empty">
                            <i className="bi bi-calendar2-heart" aria-hidden="true" />
                            <strong>
                                {customerTab === "upcoming" ? "No upcoming appointments" : customerTab === "past" ? "No past visits yet" : "No cancelled appointments"}
                            </strong>
                            {customerTab === "upcoming" && (
                                <button type="button" className="sc-btn sc-btn-primary" onClick={() => navigate("/appointments/online")}>Book an appointment</button>
                            )}
                        </div>
                    ) : (
                        <div className="sc-appt-list">
                            {rows.map((a) => {
                                const d = dateParts(a.appointmentDate);
                                return (
                                    <article className={`sc-appt-card sc-appt-card--${customerTab}`} key={a.appointmentId}>
                                        <div className="sc-date-tile" aria-hidden="true">
                                            <span>{d.month}</span>
                                            <strong>{d.day}</strong>
                                            <span>{d.weekday}</span>
                                        </div>
                                        <div className="sc-appt-main">
                                            {getStatusBadge(a.status)}
                                            <h2>{a.serviceNames}</h2>
                                            <div className="sc-appt-meta">
                                                <span><i className="bi bi-clock" aria-hidden="true" /> {time(a)}</span>
                                                <span><i className="bi bi-person" aria-hidden="true" /> {a.technicianNames || "Any available technician"}</span>
                                                <span><i className="bi bi-receipt" aria-hidden="true" /> {payment(a)}</span>
                                            </div>
                                        </div>
                                        <div className="sc-appt-actions">
                                            {changeable(a) && (
                                                <button type="button" className="sc-btn sc-btn-ghost" onClick={() => navigate(`/appointments/${a.appointmentId}/reschedule`)}>
                                                    Reschedule
                                                </button>
                                            )}
                                            {changeable(a) && (
                                                <button type="button" className="sc-btn sc-btn-ghost" onClick={() => { setCancelReason(""); setCancelError(""); setCancelTarget(a); }}>
                                                    Cancel
                                                </button>
                                            )}
                                            {canPay(a) && (
                                                <button type="button" className="sc-btn sc-btn-primary" onClick={() => navigate(`/appointments/${a.appointmentId}`)}>
                                                    Pay with VNPay
                                                </button>
                                            )}
                                            {a.status === "Completed" && (
                                                <button type="button" className="sc-btn sc-btn-primary" onClick={() => navigate(`/feedback/new?appointmentId=${a.appointmentId}`)}>
                                                    Write a review
                                                </button>
                                            )}
                                            <button type="button" className="sc-btn sc-btn-ghost" onClick={() => navigate(`/appointments/${a.appointmentId}`)}>
                                                Details
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {customerTab === "upcoming" && !loading && !loadError && recent.length > 0 && (
                        <div className="sc-recent">
                            <h2>Recently</h2>
                            {recent.map((a) => (
                                <div className="sc-recent-row" key={a.appointmentId}>
                                    <span className="sc-muted">{formatAppointmentDate(a.appointmentDate)}</span>
                                    <span>
                                        <strong>{a.serviceNames}</strong>
                                        <small>{a.technicianNames || "—"}</small>
                                    </span>
                                    {getStatusBadge(a.status)}
                                    <button type="button" className="sc-btn sc-btn-primary" onClick={() => navigate(`/feedback/new?appointmentId=${a.appointmentId}`)}>
                                        Write a review
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <Modal show={!!cancelTarget} onHide={() => !cancelling && setCancelTarget(null)} centered>
                    <Form onSubmit={confirmCancel}>
                        <Modal.Header closeButton={!cancelling}><Modal.Title>Cancel appointment</Modal.Title></Modal.Header>
                        <Modal.Body>
                            {cancelTarget && (
                                <p>
                                    Cancel <strong>{cancelTarget.serviceNames}</strong> on {formatAppointmentDate(cancelTarget.appointmentDate)} at {String(cancelTarget.startTime || "").slice(0, 5)}?
                                </p>
                            )}
                            {cancelError && <div className="alert alert-danger py-2">{cancelError}</div>}
                            <Form.Group>
                                <Form.Label>Reason *</Form.Label>
                                <Form.Control as="textarea" rows={2} maxLength={255} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} autoFocus />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" disabled={cancelling} onClick={() => setCancelTarget(null)}>Keep appointment</Button>
                            <Button variant="danger" type="submit" disabled={cancelling || !cancelReason.trim()}>{cancelling ? "Cancelling…" : "Confirm cancellation"}</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </div>
        );
    }

    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="manager-page-title mb-4 fw-bold">
                Appointment list
            </h2>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="manager-list-toolbar">{toolbar}</div>

                {isManagerOrReceptionist && (
                    <Button
                        className="fw-bold text-white shadow-sm px-4 py-2"
                        style={{ backgroundColor: "#800020", border: "none" }}
                        onClick={() => navigate("/appointments/create")}
                    >
                        <i className="bi bi-calendar-plus me-2"></i> Create appointment
                    </Button>
                )}
            </div>

            {errorPanel}
            {loading && <p role="status">Loading appointments...</p>}

            <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0 manager-list-table">
                            <thead style={{ backgroundColor: "#800020", color: "#ffffff" }}>
                                <tr>
                                    <th className="ps-3 py-3">Code</th>
                                    <th className="py-3">Date & time</th>
                                    <th className="py-3">Customer</th>
                                    <th className="py-3">Service</th>
                                    <th className="py-3">Status</th>
                                    <th className="text-center pe-3 py-3">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((a) => (
                                        <tr key={a.appointmentId}>
                                            <td className="ps-3 fw-bold">#{a.appointmentId}</td>
                                            {/* Mỗi ô chỉ 1 dòng cho gọn; chi tiết (SĐT, KTV, giờ kết thúc, ghi chú) xem ở trang View */}
                                            <td className="text-nowrap">
                                                {formatAppointmentDate(a.appointmentDate)} · {String(a.startTime || "").slice(0, 5)}
                                            </td>
                                            <td className="fw-semibold text-dark" title={a.customerPhone || undefined}>{a.customerName}</td>
                                            <td title={[a.serviceNames, a.technicianNames].filter(Boolean).join(" · ") || undefined}>
                                                {(() => {
                                                    const names = String(a.serviceNames || "").split(",").map((x) => x.trim()).filter(Boolean);
                                                    return (
                                                        <>
                                                            {names[0] || "—"}
                                                            {names.length > 1 && <span className="text-muted"> +{names.length - 1}</span>}
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                            <td className="text-nowrap" title={a.timingNote || undefined}>
                                                {getStatusBadge(a.status)}
                                                {a.timingNote && /Confirmation deadline passed|More than 15 minutes late/.test(a.timingNote) && (
                                                    <i className="bi bi-exclamation-circle-fill text-danger ms-2" aria-label={a.timingNote} />
                                                )}
                                            </td>
                                            <td className="text-center pe-3">
                                                <div className="manager-list-actions">
                                                {isManagerOrReceptionist && a.status === "Pending" && a.canConfirm !== false && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="manager-list-action manager-list-action--edit"
                                                        disabled={approvingId === a.appointmentId}
                                                        onClick={() => approve(a.appointmentId)}
                                                    >
                                                        <i className="bi bi-check2-circle me-1"></i> Confirm
                                                    </Button>
                                                )}
                                                {isManagerOrReceptionist && a.canCheckIn === true && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="manager-list-action manager-list-action--edit"
                                                        onClick={() => navigate(`/receptionist/dashboard?appointmentId=${a.appointmentId}`)}
                                                    >
                                                        <i className="bi bi-door-open me-1"></i> Check-in
                                                    </Button>
                                                )}
                                                {isManagerOrReceptionist && a.canNoShow === true && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="manager-list-action manager-list-action--delete"
                                                        disabled={approvingId === a.appointmentId}
                                                        onClick={() => markNoShow(a.appointmentId)}
                                                    >
                                                        <i className="bi bi-person-x me-1"></i> No-show
                                                    </Button>
                                                )}
                                                <Button
                                                variant="link"
                                                size="sm"
                                                className="manager-list-action manager-list-action--view"
                                                onClick={() =>
                                                    navigate(`/appointments/${a.appointmentId}`)
                                                }
                                                >
                                                    <i className="bi bi-eye-fill me-1"></i> View
                                                </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center text-muted py-4"
                                        >
                                            {loading ? "Loading appointments..." : loadError ? "Could not load appointment data." : "No appointments found."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AppointmentList;