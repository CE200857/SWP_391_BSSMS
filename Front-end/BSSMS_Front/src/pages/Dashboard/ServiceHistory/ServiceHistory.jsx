import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Spinner,
    Table,
} from "react-bootstrap";

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
    const [keyword, setKeyword] = useState("");
    const [customerIdInput, setCustomerIdInput] = useState("");
    const [appliedCustomerId, setAppliedCustomerId] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadHistory = useCallback(async (customerId = "", isRefresh = false) => {
        setError("");
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (canFilterByCustomer && customerId.trim()) {
                params.set("customerId", customerId.trim());
            }

            const queryString = params.toString();
            const url = queryString
                ? `/api/service-history?${queryString}`
                : "/api/service-history";

            const response = await fetch(url, { credentials: "include" });
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
    }, [canFilterByCustomer]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
        loadHistory(appliedCustomerId);
    }, [loadHistory, appliedCustomerId]);

    const filteredHistory = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLocaleLowerCase("vi-VN");
        if (!normalizedKeyword) return history;

        return history.filter((item) => {
            const searchableValues = [
                item.appointmentId,
                item.customerName,
                item.serviceName,
                item.staffName,
                item.notes,
                item.appointmentDate,
            ];

            return searchableValues.some((value) =>
                String(value ?? "").toLocaleLowerCase("vi-VN").includes(normalizedKeyword)
            );
        });
    }, [history, keyword]);

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        setAppliedCustomerId(customerIdInput.trim());
    };

    const handleResetCustomerFilter = () => {
        setCustomerIdInput("");
        setAppliedCustomerId("");
    };

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
                    onClick={() => loadHistory(appliedCustomerId, true)}
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
                        onClick={() => loadHistory(appliedCustomerId, true)}
                        disabled={refreshing}
                    >
                        Thử lại
                    </Button>
                </Alert>
            )}

            <Card className="service-history-filter-card border-0 mb-4">
                <Card.Body>
                    <Form onSubmit={handleFilterSubmit}>
                        <Row className="g-3 align-items-end">
                            {canFilterByCustomer && (
                                <Col xs={12} md={4} lg={3}>
                                    <Form.Group controlId="serviceHistoryCustomerId">
                                        <Form.Label className="service-history-label">
                                            Mã khách hàng
                                        </Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="Tất cả khách hàng"
                                            value={customerIdInput}
                                            onChange={(event) => setCustomerIdInput(event.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            )}
                            <Col xs={12} md={canFilterByCustomer ? 5 : 9}>
                                <Form.Group controlId="serviceHistoryKeyword">
                                    <Form.Label className="service-history-label">
                                        Tìm trong lịch sử
                                    </Form.Label>
                                    <Form.Control
                                        type="search"
                                        placeholder="Tìm theo dịch vụ, nhân viên, ghi chú..."
                                        value={keyword}
                                        onChange={(event) => setKeyword(event.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            {canFilterByCustomer && (
                                <Col
                                    xs={12}
                                    md={4}
                                    lg={3}
                                    className="d-flex gap-2"
                                >
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-grow-1 text-nowrap"
                                    >
                                        Tra cứu
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline-secondary"
                                        className="flex-grow-1 text-nowrap"
                                        onClick={handleResetCustomerFilter}
                                        title="Bỏ lọc khách hàng"
                                    >
                                        Xóa lọc
                                    </Button>
                                </Col>
                            )}
                        </Row>
                        {canFilterByCustomer && (
                            <div className="service-history-filter-hint mt-2">
                                Để trống mã khách hàng để xem lịch sử của tất cả khách hàng.
                            </div>
                        )}
                    </Form>
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
                                : "Hãy thử từ khóa khác hoặc bỏ bộ lọc khách hàng."}
                        </p>
                    </div>
                ) : (
                    <Table responsive hover className="service-history-table mb-0 align-middle">
                        <thead>
                            <tr>
                                <th>Mã lịch hẹn</th>
                                <th>Ngày thực hiện</th>
                                <th>Giờ</th>
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
                                    <td>{formatDate(item.appointmentDate)}</td>
                                    <td className="text-nowrap">
                                        {formatTime(item.startTime)}
                                        {item.endTime ? ` – ${formatTime(item.endTime)}` : ""}
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
