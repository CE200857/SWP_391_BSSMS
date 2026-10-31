import { useState, useEffect } from "react";
import {
    Container,
    Card,
    Table,
    Badge,
    Form,
    InputGroup,
    Button,
    Alert,
    Spinner,
    Modal,
    Row,
    Col,
} from "react-bootstrap";

const RecordTreatmentOutcome = () => {
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showOutcomeModal, setShowOutcomeModal] = useState(false);
    const [outcomeData, setOutcomeData] = useState({
        notes: "",
        outcomeStatus: "Completed",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isTechnician = user?.role === "Technician";
    const isManager = user?.role === "Manager";

    async function fetchData() {
        setIsLoading(true);
        setLoadError("");
        try {
            const [apptRes, serviceRes] = await Promise.all([
                fetch("/api/appointments"),
                fetch("/api/service"),
            ]);

            if (!apptRes.ok) throw new Error(`Không thể tải lịch hẹn (HTTP ${apptRes.status}).`);
            const apptData = await apptRes.json();
            const serviceData = serviceRes.ok ? await serviceRes.json() : [];

            setAppointments(Array.isArray(apptData) ? apptData : []);
            setServices(Array.isArray(serviceData) ? serviceData : []);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setLoadError(err.message || "Không thể tải dữ liệu.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        // This request owns the initial loading and error states.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, []);


    const handleOpenOutcome = (appointment) => {
        setSelectedAppointment(appointment);
        setOutcomeData({
            notes: "",
            outcomeStatus: appointment.status === "Checked-in" ? "In-progress" : "Completed",
        });
        setShowOutcomeModal(true);
    };

    const handleViewOutcome = async (appointment) => {
        try {
            const response = await fetch(`/api/treatment-outcomes/${appointment.appointmentId}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Không tải được kết quả điều trị.");
            setSelectedAppointment(appointment);
            setOutcomeData({ notes: data.notes || "", outcomeStatus: "Completed" });
            setShowOutcomeModal(true);
        } catch (error) {
            alert(error.message || "Không tải được kết quả điều trị.");
        }
    };

    const handleSubmitOutcome = async () => {
        if (!selectedAppointment || !isTechnician) return;
        if (outcomeData.outcomeStatus === "Completed" && !outcomeData.notes.trim()) {
            alert("Vui lòng nhập kết quả điều trị trước khi hoàn thành.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Cập nhật trạng thái appointment
            const response = await fetch(`/api/treatment-outcomes/${selectedAppointment.appointmentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: outcomeData.outcomeStatus,
                    notes: outcomeData.notes,
                }),
            });

            if (response.ok) {
                alert("Ghi nhận kết quả điều trị thành công!");
                setShowOutcomeModal(false);
                setSelectedAppointment(null);
                // Tải lại danh sách
                fetchData();
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.message || "Cập nhật thất bại!");
            }
        } catch (err) {
            console.error("Lỗi cập nhật:", err);
            alert("Lỗi kết nối đến máy chủ!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getServiceName = (serviceId) => {
        const service = services.find((s) => s.serviceId === serviceId);
        return service ? service.serviceName : `Dịch vụ #${serviceId}`;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            "Checked-in": { bg: "info", text: "Đã check-in" },
            "Pending": { bg: "primary", text: "Chờ xác nhận" },
            "Confirmed": { bg: "info", text: "Đã xác nhận" },
            "In-progress": { bg: "warning", text: "Đang thực hiện" },
            "Completed": { bg: "success", text: "Hoàn thành" },
            "Cancelled": { bg: "danger", text: "Đã hủy" },
            "No-show": { bg: "secondary", text: "Không đến" },
        };
        const style = statusMap[status] || { bg: "dark", text: status };
        return <Badge bg={style.bg}>{style.text}</Badge>;
    };

    const filteredAppointments = appointments.filter((a) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            a.customerName?.toLowerCase().includes(search) ||
            a.serviceName?.toLowerCase().includes(search) ||
            String(a.appointmentId).includes(search);
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("vi-VN");
        } catch {
            return dateStr;
        }
    };

    if (!isTechnician && !isManager) {
        return (
            <Container className="mt-4 px-4">
                <Alert variant="warning">
                    Bạn không có quyền truy cập trang này. Chỉ Kỹ thuật viên hoặc Quản lý mới có thể xem trang này.
                </Alert>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="danger" />
                <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="fw-bold text-uppercase mb-4">Ghi nhận kết quả điều trị</h2>

            {loadError && <Alert variant="danger">{loadError}</Alert>}
            <p className="text-muted">Kỹ thuật viên phụ trách bắt đầu thực hiện sau khi check-in và ghi kết quả khi hoàn thành. Quản lý xem tiến độ và kết quả.</p>

            {/* Bộ lọc */}
            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <InputGroup style={{ maxWidth: "320px" }}>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Tìm theo khách hàng, dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>

                        <Form.Select
                            style={{ maxWidth: "200px" }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Pending">Chờ xác nhận</option>
                            <option value="Confirmed">Đã xác nhận</option>
<option value="Checked-in">Đã check-in</option>
                            <option value="In-progress">Đang thực hiện</option>
                            <option value="Completed">Hoàn thành</option>
                            <option value="Cancelled">Đã hủy</option>
                            <option value="No-show">Không đến</option>
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            {/* Bảng danh sách lịch hẹn */}
            <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                <Card.Body className="p-0">
                    <Table striped bordered hover responsive className="align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Ngày</th>
                                <th>Thời gian</th>
                                <th>Khách hàng</th>
                                <th>Dịch vụ</th>
                                <th>Nhân viên</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.length > 0 ? (
                                filteredAppointments.map((a) => (
                                    <tr key={a.appointmentId}>
                                        <td>{a.appointmentId}</td>
                                        <td>{formatDate(a.appointmentDate)}</td>
                                        <td>{a.startTime} - {a.endTime || "—"}</td>
                                        <td>{a.customerName || "—"}</td>
                                        <td>{a.serviceName || getServiceName(a.serviceId)}</td>
                                        <td>{a.staffName || "—"}</td>
                                        <td>{getStatusBadge(a.status)}</td>
                                        <td>
                                            {(isTechnician && (a.status === "Checked-in" || a.status === "In-progress")) && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    onClick={() => handleOpenOutcome(a)}
                                                >
                                                    <i className="bi bi-clipboard-check me-1"></i>
                                                    Ghi nhận
                                                </Button>
                                            )}
                                            {a.status === "Completed" && (
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => handleViewOutcome(a)}
                                                >
                                                    <i className="bi bi-eye me-1"></i>
                                                    Xem
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-4">
                                        Không có lịch hẹn phù hợp với bộ lọc. Lịch phải được check-in trước khi kỹ thuật viên ghi nhận kết quả.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Modal ghi nhận kết quả */}
            <Modal show={showOutcomeModal} onHide={() => setShowOutcomeModal(false)} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <i className="bi bi-clipboard-check me-2"></i>
                        Ghi nhận kết quả điều trị
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAppointment && (
                        <>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Lịch hẹn:</strong> #{selectedAppointment.appointmentId}
                                </Col>
                                <Col md={6}>
                                    <strong>Khách hàng:</strong> {selectedAppointment.customerName || "—"}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Col md={6}>
                                    <strong>Dịch vụ:</strong> {selectedAppointment.serviceName || getServiceName(selectedAppointment.serviceId)}
                                </Col>
                                <Col md={6}>
                                    <strong>Ngày:</strong> {formatDate(selectedAppointment.appointmentDate)}
                                </Col>
                            </Row>

                            <hr />

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Kết quả điều trị *</Form.Label>
                                <Form.Select
                                    disabled={selectedAppointment.status === "Completed"}
                                    value={outcomeData.outcomeStatus}
                                    onChange={(e) =>
                                        setOutcomeData((prev) => ({
                                            ...prev,
                                            outcomeStatus: e.target.value,
                                        }))
                                    }
                                >
                                    {selectedAppointment.status === "Checked-in" ? (
                                        <option value="In-progress">Bắt đầu thực hiện</option>
                                    ) : (
                                        <option value="Completed">Hoàn thành</option>
                                    )}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Kết quả điều trị {outcomeData.outcomeStatus === "Completed" ? "*" : ""}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    disabled={outcomeData.outcomeStatus !== "Completed" || selectedAppointment.status === "Completed"}
                                    rows={4}
                                    placeholder={outcomeData.outcomeStatus === "Completed" ? "Nhập kết quả điều trị..." : "Nhập kết quả khi hoàn thành buổi điều trị."}
                                    value={outcomeData.notes}
                                    onChange={(e) =>
                                        setOutcomeData((prev) => ({
                                            ...prev,
                                            notes: e.target.value,
                                        }))
                                    }
                                    maxLength={500}
                                />
                                <Form.Text className="text-muted">
                                    {outcomeData.notes.length}/500 ký tự
                                </Form.Text>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowOutcomeModal(false)}>
                        Hủy bỏ
                    </Button>
                    {selectedAppointment?.status !== "Completed" && <Button
                        variant="success"
                        onClick={handleSubmitOutcome}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
                    </Button>}
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default RecordTreatmentOutcome;
