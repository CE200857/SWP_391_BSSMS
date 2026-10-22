import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Spinner,
    Table
} from "react-bootstrap";

const money = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(Number(value || 0));

const formatDateTime = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString("vi-VN");
};

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString("vi-VN");
};

const statusVariant = (status) => {
    switch ((status || "").toLowerCase()) {
        case "paid":
            return "success";
        case "unpaid":
            return "warning";
        case "partially refunded":
            return "info";
        case "refunded":
            return "secondary";
        case "cancelled":
            return "danger";
        default:
            return "dark";
    }
};

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || `Yêu cầu thất bại (${response.status}).`);
    }
    return data;
};

const InvoiceManagement = () => {
    const [invoices, setInvoices] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listError, setListError] = useState("");
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedData, setSelectedData] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    const [actionType, setActionType] = useState("");
    const [actionReason, setActionReason] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [submittingAction, setSubmittingAction] = useState(false);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const loadInvoices = useCallback(async () => {
        setLoadingList(true);
        setListError("");
        try {
            const data = await fetchJson("/api/invoices");
            setInvoices(Array.isArray(data) ? data : []);
        } catch (error) {
            setListError(error.message || "Không thể tải danh sách hóa đơn.");
        } finally {
            setLoadingList(false);
        }
    }, []);

    const loadInvoiceDetails = useCallback(async (invoiceId) => {
        setLoadingDetails(true);
        setDetailsError("");
        setSelectedData(null);
        try {
            const data = await fetchJson(`/api/invoices/${invoiceId}`);
            setSelectedData(data);
        } catch (error) {
            setDetailsError(error.message || "Không thể tải chi tiết hóa đơn.");
        } finally {
            setLoadingDetails(false);
        }
    }, []);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    const filteredInvoices = useMemo(() => {
        const normalizedSearch = searchText.trim().toLowerCase();
        return invoices.filter((invoice) => {
            const matchesSearch = !normalizedSearch || [
                invoice.invoiceId,
                invoice.appointmentId,
                invoice.customerName,
                invoice.customerPhone,
                invoice.serviceName
            ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch));

            const matchesStatus = statusFilter === "all"
                || (invoice.status || "").toLowerCase() === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchText, statusFilter]);

    const invoice = selectedData?.invoice;
    const invoiceStatus = (invoice?.status || "").toLowerCase();

    const actions = selectedData?.actions || [];
    const payments = selectedData?.payments || [];

    const successfulPayments = payments.filter(
        (payment) =>
            String(payment.status || "").toLowerCase() === "success"
    );

    const successfulPaymentTotal = successfulPayments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0
    );

    const paymentDataMatches =
        successfulPayments.length === 1 &&
        Math.abs(
            successfulPaymentTotal - Number(invoice?.totalAmount || 0)
        ) < 0.01;

    const hasSuccessfulPayment = successfulPayments.length > 0;

    const canRefund =
        (invoiceStatus === "paid" ||
            invoiceStatus === "partially refunded") &&
        paymentDataMatches;

    const totalRefunded = actions
        .filter((action) => action.actionType === "Refund")
        .reduce((sum, action) => sum + Number(action.amount || 0), 0);

    const remainingRefundable = Math.max(
        0,
        Number(invoice?.totalAmount || 0) - totalRefunded
    );

    const closeDetailsModal = () => {
        if (submittingAction || actionType) return;

        setSelectedData(null);
        setDetailsError("");
    };

    const openActionModal = (type) => {
        setActionType(type);
        setActionReason("");
        setRefundAmount(type === "refund" ? String(remainingRefundable) : "");
        setActionError("");
    };

    const closeActionModal = () => {
        if (submittingAction) return;
        setActionType("");
        setActionError("");
    };

    const submitInvoiceAction = async (event) => {
        event.preventDefault();
        if (!invoice) return;

        const reason = actionReason.trim();
        if (!reason) {
            setActionError("Vui lòng nhập lý do.");
            return;
        }
        if (reason.length > 500) {
            setActionError("Lý do không được vượt quá 500 ký tự.");
            return;
        }

        let payload;
        let endpoint;
        if (actionType === "refund") {
            const amount = Number(refundAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                setActionError("Số tiền hoàn phải lớn hơn 0.");
                return;
            }
            if (amount > remainingRefundable) {
                setActionError(`Số tiền hoàn không được vượt quá ${money(remainingRefundable)}.`);
                return;
            }
            endpoint = `/api/invoices/${invoice.invoiceId}/refund`;
            payload = { amount, reason };
        } else if (actionType === "cancel") {
            endpoint = `/api/invoices/${invoice.invoiceId}/cancel`;
            payload = { reason };
        } else {
            return;
        }

        setSubmittingAction(true);
        setActionError("");
        setSuccessMessage("");
        try {
            const result = await fetchJson(endpoint, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            setSuccessMessage(result?.message || "Đã cập nhật hóa đơn.");
            setActionType("");
            await loadInvoices();
            await loadInvoiceDetails(invoice.invoiceId);
        } catch (error) {
            setActionError(error.message || "Không thể thực hiện thao tác.");
        } finally {
            setSubmittingAction(false);
        }
    };

    return (
        <Container fluid className="py-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                    <h2 className="mb-1">Hóa đơn &amp; Thanh toán</h2>
                    <p className="text-muted mb-0">Tra cứu hóa đơn, lịch sử thanh toán và xử lý hoàn tiền/hủy hóa đơn.</p>
                </div>
                <Button variant="outline-primary" onClick={loadInvoices} disabled={loadingList}>
                    {loadingList ? <Spinner size="sm" animation="border" className="me-2" /> : <i className="bi bi-arrow-clockwise me-2" />}
                    Làm mới
                </Button>
            </div>

            {successMessage && (
                <Alert variant="success" dismissible onClose={() => setSuccessMessage("")}>{successMessage}</Alert>
            )}
            {listError && <Alert variant="danger">{listError}</Alert>}

            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Row className="g-3 mb-3">
                        <Col md={8} lg={9}>
                            <Form.Label>Tìm hóa đơn</Form.Label>
                            <Form.Control
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Nhập mã hóa đơn, mã lịch hẹn, tên khách hàng, số điện thoại hoặc dịch vụ"
                            />
                        </Col>
                        <Col md={4} lg={3}>
                            <Form.Label>Trạng thái</Form.Label>
                            <Form.Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                <option value="all">Tất cả trạng thái</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                                <option value="partially refunded">Partially Refunded</option>
                                <option value="refunded">Refunded</option>
                                <option value="cancelled">Cancelled</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    {loadingList ? (
                        <div className="text-center py-5"><Spinner animation="border" /><div className="mt-2">Đang tải danh sách hóa đơn...</div></div>
                    ) : filteredInvoices.length === 0 ? (
                        <Alert variant="light" className="mb-0">Không tìm thấy hóa đơn phù hợp.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table hover bordered responsive className="align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Mã HĐ</th>
                                        <th>Ngày tạo</th>
                                        <th>Khách hàng</th>
                                        <th>Dịch vụ</th>
                                        <th className="text-end">Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th className="text-center">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((item) => (
                                        <tr key={item.invoiceId}>
                                            <td>#{item.invoiceId}</td>
                                            <td>{formatDateTime(item.invoiceDate)}</td>
                                            <td>
                                                <div className="fw-semibold">{item.customerName || "—"}</div>
                                                <small className="text-muted">{item.customerPhone || "—"}</small>
                                            </td>
                                            <td>{item.serviceName || "—"}</td>
                                            <td className="text-end text-nowrap">{money(item.totalAmount)}</td>
                                            <td><Badge bg={statusVariant(item.status)}>{item.status || "Unknown"}</Badge></td>
                                            <td className="text-center">
                                                <Button size="sm" variant="outline-primary" onClick={() => loadInvoiceDetails(item.invoiceId)}>
                                                    Xem chi tiết
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal
                show={loadingDetails || Boolean(invoice) || Boolean(detailsError)}
                onHide={closeDetailsModal}
                size="xl"
                centered
                scrollable
            >
                {loadingDetails ? (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title>Chi tiết hóa đơn</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="text-center py-5">
                                <Spinner animation="border" />
                                <div className="mt-2">
                                    Đang tải chi tiết hóa đơn...
                                </div>
                            </div>
                        </Modal.Body>
                    </>
                ) : detailsError ? (
                    <>
                        <Modal.Header closeButton>
                            <Modal.Title>Không thể tải hóa đơn</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Alert variant="danger" className="mb-0">
                                {detailsError}
                            </Alert>
                        </Modal.Body>
                    </>
                ) : invoice && (
                    <>
                        <Modal.Header closeButton>
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 w-100 me-3">
                                <Modal.Title>
                                    Chi tiết hóa đơn #{invoice.invoiceId}
                                </Modal.Title>

                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <Badge bg={statusVariant(invoice.status)}>
                                        {invoice.status}
                                    </Badge>

                                    {canRefund && remainingRefundable > 0 && (
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            onClick={() => openActionModal("refund")}
                                        >
                                            Hoàn tiền
                                        </Button>
                                    )}

                                    {invoiceStatus === "unpaid" &&
                                        !hasSuccessfulPayment && (
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => openActionModal("cancel")}
                                            >
                                                Hủy hóa đơn
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </Modal.Header>

                        <Modal.Body>
                            {(invoiceStatus === "paid" ||
                                invoiceStatus === "partially refunded") &&
                                !paymentDataMatches && (
                                    <Alert variant="warning">
                                        Không thể hoàn tiền theo điều kiện hiện tại:
                                        hóa đơn phải có đúng một giao dịch Success và
                                        tổng tiền giao dịch phải bằng tổng tiền hóa đơn.
                                        Vui lòng kiểm tra dữ liệu thanh toán.
                                    </Alert>
                                )}

                            {invoiceStatus === "unpaid" &&
                                hasSuccessfulPayment && (
                                    <Alert variant="warning">
                                        Hóa đơn đang có trạng thái Unpaid nhưng đã có
                                        giao dịch Success. Không thể hủy trước khi đối
                                        soát lại trạng thái và số tiền thanh toán.
                                    </Alert>
                                )}

                            <Row className="g-3 mb-4">
                                <Col md={6} lg={3}>
                                    <div className="text-muted small">Khách hàng</div>
                                    <div className="fw-semibold">
                                        {invoice.customerName || "—"}
                                    </div>
                                    <div>{invoice.customerPhone || "—"}</div>
                                </Col>

                                <Col md={6} lg={3}>
                                    <div className="text-muted small">Lịch hẹn</div>
                                    <div className="fw-semibold">
                                        #{invoice.appointmentId}
                                    </div>
                                    <div>
                                        {formatDate(invoice.appointmentDate)} ·{" "}
                                        {invoice.startTime || "—"} -{" "}
                                        {invoice.endTime || "—"}
                                    </div>
                                </Col>

                                <Col md={6} lg={3}>
                                    <div className="text-muted small">
                                        Ngày lập hóa đơn
                                    </div>
                                    <div className="fw-semibold">
                                        {formatDateTime(invoice.invoiceDate)}
                                    </div>
                                    <div>Dịch vụ: {invoice.serviceName || "—"}</div>
                                </Col>

                                <Col md={6} lg={3}>
                                    <div className="text-muted small">
                                        Tổng thanh toán
                                    </div>
                                    <div className="fw-bold fs-5">
                                        {money(invoice.totalAmount)}
                                    </div>
                                    <div>Đã hoàn: {money(totalRefunded)}</div>
                                    <div>
                                        Còn có thể hoàn: {money(remainingRefundable)}
                                    </div>
                                </Col>
                            </Row>

                            <Row className="g-4">
                                <Col lg={6}>
                                    <h6>Chi phí hóa đơn</h6>

                                    <Table bordered size="sm">
                                        <tbody>
                                            <tr>
                                                <td>Tạm tính</td>
                                                <td className="text-end">
                                                    {money(invoice.subtotal)}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Giảm giá</td>
                                                <td className="text-end">
                                                    {money(invoice.discount)}
                                                </td>
                                            </tr>
                                            <tr className="fw-bold">
                                                <td>Tổng cộng</td>
                                                <td className="text-end">
                                                    {money(invoice.totalAmount)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>

                                    <h6 className="mt-4">Sản phẩm kèm theo</h6>

                                    {selectedData.products?.length ? (
                                        <Table
                                            bordered
                                            responsive
                                            size="sm"
                                            className="align-middle"
                                        >
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Sản phẩm</th>
                                                    <th className="text-end">SL</th>
                                                    <th className="text-end">Đơn giá</th>
                                                    <th className="text-end">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedData.products.map((item) => (
                                                    <tr key={item.productId}>
                                                        <td>{item.productName}</td>
                                                        <td className="text-end">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="text-end">
                                                            {money(item.unitPrice)}
                                                        </td>
                                                        <td className="text-end">
                                                            {money(item.subtotal)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-muted small">
                                            Không có sản phẩm kèm theo.
                                        </div>
                                    )}
                                </Col>

                                <Col lg={6}>
                                    <h6>Lịch sử thanh toán</h6>

                                    {selectedData.payments?.length ? (
                                        <Table
                                            bordered
                                            responsive
                                            size="sm"
                                            className="align-middle"
                                        >
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Mã GD</th>
                                                    <th>Phương thức</th>
                                                    <th className="text-end">Số tiền</th>
                                                    <th>Ngày</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedData.payments.map((payment) => (
                                                    <tr key={payment.paymentId}>
                                                        <td>
                                                            {payment.transactionCode ||
                                                                `#${payment.paymentId}`}
                                                        </td>
                                                        <td>
                                                            {payment.paymentMethod || "—"}
                                                        </td>
                                                        <td className="text-end text-nowrap">
                                                            {money(payment.amount)}
                                                        </td>
                                                        <td>
                                                            {formatDateTime(
                                                                payment.paymentDate
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    String(payment.status || "")
                                                                        .toLowerCase() === "success"
                                                                        ? "success"
                                                                        : "secondary"
                                                                }
                                                            >
                                                                {payment.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-muted small">
                                            Chưa có giao dịch thanh toán.
                                        </div>
                                    )}

                                    <h6 className="mt-4">
                                        Lịch sử hoàn tiền / hủy
                                    </h6>

                                    {selectedData.actions?.length ? (
                                        <Table
                                            bordered
                                            responsive
                                            size="sm"
                                            className="align-middle"
                                        >
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Thao tác</th>
                                                    <th className="text-end">Số tiền</th>
                                                    <th>Lý do</th>
                                                    <th>Thời gian</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedData.actions.map((action) => (
                                                    <tr key={action.actionId}>
                                                        <td>{action.actionType}</td>
                                                        <td className="text-end text-nowrap">
                                                            {action.amount == null
                                                                ? "—"
                                                                : money(action.amount)}
                                                        </td>
                                                        <td>{action.reason}</td>
                                                        <td>
                                                            {formatDateTime(action.createdAt)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className="text-muted small">
                                            Chưa có lịch sử thao tác.
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Modal.Body>
                    </>
                )}
            </Modal>

            <Modal show={Boolean(actionType)} onHide={closeActionModal} centered>
                <Form onSubmit={submitInvoiceAction}>
                    <Modal.Header closeButton={!submittingAction}>
                        <Modal.Title>{actionType === "refund" ? "Hoàn tiền hóa đơn" : "Hủy hóa đơn"}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {actionError && <Alert variant="danger">{actionError}</Alert>}
                        {actionType === "refund" && (
                            <>
                                <Alert variant="info">Số tiền còn có thể hoàn: <strong>{money(remainingRefundable)}</strong></Alert>
                                <Form.Group className="mb-3">
                                    <Form.Label>Số tiền hoàn (VND)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0.01"
                                        max={remainingRefundable}
                                        step="0.01"
                                        value={refundAmount}
                                        onChange={(event) => setRefundAmount(event.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </>
                        )}
                        {actionType === "cancel" && (
                            <Alert variant="warning">Chỉ hóa đơn chưa thanh toán mới được hủy. Thao tác này sẽ ghi vào lịch sử hóa đơn.</Alert>
                        )}
                        <Form.Group>
                            <Form.Label>Lý do {actionType === "refund" ? "hoàn tiền" : "hủy hóa đơn"}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                maxLength={500}
                                value={actionReason}
                                onChange={(event) => setActionReason(event.target.value)}
                                placeholder="Nhập lý do cụ thể..."
                                required
                            />
                            <Form.Text muted>{actionReason.length}/500 ký tự</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={closeActionModal} disabled={submittingAction}>Đóng</Button>
                        <Button variant={actionType === "refund" ? "warning" : "danger"} type="submit" disabled={submittingAction}>
                            {submittingAction ? <><Spinner size="sm" animation="border" className="me-2" />Đang xử lý...</> : "Xác nhận"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default InvoiceManagement;