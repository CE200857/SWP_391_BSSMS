import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Spinner,
} from "react-bootstrap";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import "./ServiceHistory.css";

function formatDate(value) {
    if (!value) return "—";

    const dateText = String(value).slice(0, 10);
    const parts = dateText.split("-");
    if (parts.length !== 3) return dateText;

    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
}

function formatTime(value) {
    if (!value) return "—";
    return String(value).slice(0, 5);
}

export default function ServiceHistory({ user }) {
    const role = user?.role ?? "";
    const isCustomer = role === "Customer";
    const canFilterByCustomer = role === "Manager" || role === "Receptionist";

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadHistory = useCallback(async (isRefresh = false) => {
        setError("");
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await fetch("/api/service-history", { credentials: "include" });
            let responseData = null;
            try {
                responseData = await response.json();
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                throw new Error(
                    responseData?.message || "Could not load the service history."
                );
            }

            if (!Array.isArray(responseData)) {
                throw new Error("Service history data has an unexpected format.");
            }

            setHistory(responseData);
        } catch (requestError) {
            setHistory([]);
            setError(requestError.message || "Something went wrong while loading data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
        loadHistory();
    }, [loadHistory]);

    const searchFields = useMemo(() => [
        { key: "appointmentId", label: "Appointment ID" },
        { key: "customerName", label: "Customer", filterable: canFilterByCustomer },
        { key: "customerPhone", label: "Phone number", filterable: false },
        { key: "serviceName", label: "Service" },
        { key: "staffName", label: "Staff in charge" },
        { key: "notes", label: "Notes", filterable: false },
        { key: "appointmentDate", label: "Service date", type: "date" },
    ], [canFilterByCustomer]);
    const { filteredRows: filteredHistory, toolbar: searchFilterToolbar } =
        useManagerSearchFilter(history, searchFields, "Search by appointment ID, customer, service, staff...");

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="manager-page-title fw-bold mb-1">Service history</h2>
                    <p className="text-muted mb-0">Completed services are recorded in the system.</p>
                </div>
                <Button
                    variant="outline-secondary"
                    onClick={() => loadHistory(true)}
                    disabled={loading || refreshing}
                >
                    {refreshing ? (
                        <>
                            <Spinner size="sm" className="me-2" /> Loading
                        </>
                    ) : (
                        <>
                            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" /> Refresh
                        </>
                    )}
                </Button>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    <div className="fw-semibold">Could not load the service history</div>
                    <div>{error}</div>
                    <Button
                        size="sm"
                        variant="outline-danger"
                        className="mt-2"
                        onClick={() => loadHistory(true)}
                        disabled={refreshing}
                    >
                        Try again
                    </Button>
                </Alert>
            )}

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <div className="manager-list-toolbar">{searchFilterToolbar}</div>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center text-muted py-5">
                            <Spinner animation="border" size="sm" className="me-2" role="status" />
                            Loading service history...
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="text-center text-muted py-5 px-3">
                            <strong className="d-block mb-1">
                                {history.length === 0 ? "No service history yet" : "No results found"}
                            </strong>
                            {history.length === 0
                                ? "Completed appointments will appear here once they are recorded in the system."
                                : "Try another keyword."}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0 manager-list-table">
                                <thead>
                                    <tr>
                                        <th>Appointment</th>
                                        <th>Date &amp; time</th>
                                        {!isCustomer && <th>Customer</th>}
                                        <th>Service</th>
                                        <th>Technician</th>
                                        <th>Notes</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item, index) => (
                                        <tr key={`${item.appointmentId}-${index}`}>
                                            <td className="fw-bold">#{item.appointmentId}</td>
                                            <td>
                                                <div className="fw-semibold">{formatDate(item.appointmentDate)}</div>
                                                <small className="text-muted">
                                                    {formatTime(item.startTime)}
                                                    {item.endTime ? `–${formatTime(item.endTime)}` : ""}
                                                </small>
                                            </td>
                                            {!isCustomer && <td>{item.customerName || "—"}</td>}
                                            <td className="fw-semibold">{item.serviceName || "—"}</td>
                                            <td>{item.staffName || "—"}</td>
                                            <td className="text-muted" style={{ maxWidth: 280 }}>{item.notes?.trim() || "—"}</td>
                                            <td><Badge bg="success">Completed</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
}
