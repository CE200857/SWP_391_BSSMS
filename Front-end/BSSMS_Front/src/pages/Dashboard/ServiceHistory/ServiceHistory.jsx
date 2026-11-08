import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    Spinner,
    Table,
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
                    responseData?.message || "Không thể tải lịch sử dịch vụ."
                );
            }

            if (!Array.isArray(responseData)) {
                throw new Error("Dữ liệu lịch sử dịch vụ không đúng định dạng.");
            }

            setHistory(responseData);
        } catch (requestError) {
            setHistory([]);
            setError(requestError.message || "Đã xảy ra lỗi khi tải dữ liệu.");
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
        { key: "appointmentId", label: "Mã lịch hẹn" },
        { key: "customerName", label: "Khách hàng", filterable: canFilterByCustomer },
        { key: "customerPhone", label: "Số điện thoại", filterable: false },
        { key: "serviceName", label: "Dịch vụ" },
        { key: "staffName", label: "Nhân viên phụ trách" },
        { key: "notes", label: "Ghi chú", filterable: false },
        { key: "appointmentDate", label: "Ngày thực hiện", type: "date" },
    ], [canFilterByCustomer]);
    const { filteredRows: filteredHistory, toolbar: searchFilterToolbar } =
        useManagerSearchFilter(history, searchFields, "Tìm theo mã lịch, khách hàng, dịch vụ, nhân viên...");

    return (
        <Container fluid className="service-history-page py-3 py-lg-4">
            <div className="service-history-heading mb-4">
                <div>
                    <div className="service-history-eyebrow">BSSMS / SERVICE HISTORY</div>
                    <h1 className="service-history-title">Lịch sử dịch vụ</h1>
                    <p className="service-history-subtitle mb-0">
                        Các dịch vụ đã hoàn thành được ghi nhận trong hệ thống.
                    </p>
                </div>
                <Button
                    variant="outline-secondary"
                    className="service-history-refresh"
                    onClick={() => loadHistory(true)}
                    disabled={loading || refreshing}
                >
                    {refreshing ? (
                        <>
                            <Spinner size="sm" className="me-2" /> Đang tải
                        </>
                    ) : (
                        "Làm mới"
                    )}
                </Button>
            </div>

            {error && (
                <Alert variant="danger" className="mb-3">
                    <div className="fw-semibold">Không tải được lịch sử dịch vụ</div>
                    <div>{error}</div>
                    <Button
                        size="sm"
                        variant="outline-danger"
                        className="mt-2"
                        onClick={() => loadHistory(true)}
                        disabled={refreshing}
                    >
                        Thử lại
                    </Button>
                </Alert>
            )}

            <Card className="service-history-search-card border-0 mb-4">
                <Card.Body>
                    {searchFilterToolbar}
                </Card.Body>
            </Card>

            <Card className="service-history-results-card border-0">
                <Card.Header className="service-history-results-header bg-white">
                    <div>
                        <h2 className="service-history-section-title mb-1">
                            Các lần sử dụng dịch vụ
                        </h2>
                        <div className="service-history-muted">
                            {loading
                                ? "Đang tải dữ liệu..."
                                : `${filteredHistory.length} bản ghi`}
                        </div>
                    </div>
                    <Badge bg="success" className="service-history-completed-badge">
                        Đã hoàn thành
                    </Badge>
                </Card.Header>

                {loading ? (
                    <div className="service-history-loading py-5">
                        <Spinner animation="border" role="status" />
                        <span className="ms-3">Đang tải lịch sử dịch vụ...</span>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="service-history-empty py-5 px-3">
                        <div className="service-history-empty-icon" aria-hidden="true">◷</div>
                        <h3 className="h5 mt-3 mb-2">
                            {history.length === 0
                                ? "Chưa có lịch sử dịch vụ"
                                : "Không tìm thấy kết quả phù hợp"}
                        </h3>
                        <p className="text-secondary mb-0">
                            {history.length === 0
                                ? "Các lịch hẹn hoàn thành sẽ xuất hiện ở đây khi đã được ghi nhận trong hệ thống."
                                : "Hãy thử từ khóa khác."}
                        </p>
                    </div>
                ) : (
                    <Table responsive hover className="service-history-table mb-0 align-middle">
                        <thead>
                            <tr>
                                <th>Mã lịch hẹn</th>
                                <th>Ngày &amp; giờ</th>
                                {!isCustomer && <th>Khách hàng</th>}
                                <th>Dịch vụ</th>
                                <th>Nhân viên phụ trách</th>
                                <th>Ghi chú</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.map((item) => (
                                <tr key={item.appointmentId}>
                                    <td className="service-history-id">#{item.appointmentId}</td>
                                    <td className="service-history-date-time">
                                        <div className="fw-semibold">{formatDate(item.appointmentDate)}</div>
                                        <small className="text-muted">
                                            {formatTime(item.startTime)}
                                            {item.endTime ? `–${formatTime(item.endTime)}` : ""}
                                        </small>
                                    </td>
                                    {!isCustomer && <td>{item.customerName || "—"}</td>}
                                    <td className="service-history-service-name">
                                        {item.serviceName || "—"}
                                    </td>
                                    <td>{item.staffName || "—"}</td>
                                    <td className="service-history-notes">
                                        {item.notes?.trim() || "—"}
                                    </td>
                                    <td>
                                        <Badge bg="success">Hoàn thành</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Card>

        </Container>
    );
}
