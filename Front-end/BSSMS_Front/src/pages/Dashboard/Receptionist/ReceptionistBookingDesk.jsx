/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Card,
    Table,
    Badge,
    Button,
    Form,
    InputGroup,
    Modal,
    Row,
    Col,
    Spinner,
    Alert,
} from "react-bootstrap";

const ReceptionistBookingDesk = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [alertMsg, setAlertMsg] = useState({ type: "", text: "" });
    const [refresh, setRefresh] = useState(0);

    // State cho Modal Check-in & Status Update
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusTarget, setStatusTarget] = useState(null);
    const [newStatus, setNewStatus] = useState("Checked-in");
    const [statusNotes, setStatusNotes] = useState("");
    const [savingStatus, setSavingStatus] = useState(false);

    // State cho Modal Coordinate Service (Điều phối KTV, Phòng, Giường, Thiết bị)
    const [showCoordModal, setShowCoordModal] = useState(false);
    const [coordLoading, setCoordLoading] = useState(false);
    const [coordData, setCoordData] = useState(null);
    const [selectedTechId, setSelectedTechId] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState("");
    const [selectedBedId, setSelectedBedId] = useState("");
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
    const [savingCoord, setSavingCoord] = useState(false);

    const loadAppointments = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/booking/coordination", {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setAppointments(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Lỗi tải danh sách điều phối:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAppointments = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/booking/coordination", {
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    setAppointments(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Lỗi tải danh sách lịch hẹn:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, [refresh]);

    // --- XỬ LÝ CHECK-IN & STATUS UPDATE NHANH ---
    const handleQuickStatusUpdate = async (appointmentId, statusValue, customNotes = null) => {
        try {
            setSavingStatus(true);
            const res = await fetch("/api/booking/checkin", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    appointmentId,
                    status: statusValue,
                    notes: customNotes,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setAlertMsg({ type: "success", text: data.message });
                setShowStatusModal(false);
                setRefresh((prev) => prev + 1);
            } else {
                setAlertMsg({ type: "danger", text: data.message || "Cập nhật thất bại!" });
            }
        } catch (err) {
            setAlertMsg({ type: "danger", text: "Lỗi kết nối máy chủ!" });
        } finally {
            setSavingStatus(false);
        }
    };

    const openStatusModal = (appt) => {
        setStatusTarget(appt);
        setNewStatus(appt.status === "Booked" || appt.status === "Confirmed" ? "Checked-in" : appt.status);
        setStatusNotes(appt.notes || "");
        setShowStatusModal(true);
    };

    // --- XỬ LÝ COORDINATE SERVICE (PHÂN BỔ NHÂN SỰ & TÀI NGUYÊN) ---
    const openCoordinateModal = async (appointmentId) => {
        setShowCoordModal(true);
        setCoordLoading(true);
        setCoordData(null);

        try {
            const res = await fetch(
                `/api/booking/coordination?appointmentId=${appointmentId}`,
                { credentials: "include" }
            );
            if (res.ok) {
                const data = await res.json();
                setCoordData(data);

                const appt = data.appointment || {};
                const firstStaff = data.assignedStaff?.[0]?.staffId || "";
                // Nếu chưa có KTV, tự động gợi ý KTV đầu tiên có isSuggested = true
                const suggestedTech =
                    firstStaff ||
                    data.technicians?.find((t) => t.isSuggested)?.staffId ||
                    "";

                setSelectedTechId(String(suggestedTech));
                setSelectedRoomId(appt.roomId ? String(appt.roomId) : "");
                setSelectedBedId(appt.bedId ? String(appt.bedId) : "");
                setSelectedEquipmentIds(
                    (data.assignedEquipments || []).map((eq) => eq.equipmentId)
                );
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu điều phối:", err);
        } finally {
            setCoordLoading(false);
        }
    };

    const handleToggleEquipment = (eqId) => {
        setSelectedEquipmentIds((prev) =>
            prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
        );
    };

    const handleSaveCoordination = async (e) => {
        e.preventDefault();
        if (!coordData?.appointment) return;

        setSavingCoord(true);
        try {
            const res = await fetch("/api/booking/coordinate", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    appointmentId: coordData.appointment.appointmentId,
                    technicianId: selectedTechId ? Number(selectedTechId) : null,
                    roomId: selectedRoomId ? Number(selectedRoomId) : null,
                    bedId: selectedBedId ? Number(selectedBedId) : null,
                    equipmentIds: selectedEquipmentIds,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setAlertMsg({ type: "success", text: data.message });
                setShowCoordModal(false);
                setRefresh((prev) => prev + 1);
            } else {
                setAlertMsg({ type: "danger", text: data.message || "Điều phối thất bại!" });
            }
        } catch (err) {
            setAlertMsg({ type: "danger", text: "Lỗi kết nối máy chủ!" });
        } finally {
            setSavingCoord(false);
        }
    };

    // Lấy danh sách giường thuộc phòng đang chọn trong Modal Coordinate
    const availableBedsForSelectedRoom =
        coordData?.roomsWithBeds?.find(
            (r) => String(r.roomId) === String(selectedRoomId)
        )?.beds || [];

    const getStatusBadge = (status) => {
        const map = {
            Scheduled: { bg: "secondary", label: "Đã lên lịch" },
            Booked: { bg: "primary", label: "Đã đặt (Booked)" },
            Confirmed: { bg: "info", label: "Đã xác nhận" },
            "Checked-in": { bg: "warning", label: "Đã Check-in" },
            "In Progress": { bg: "primary", label: "Đang thực hiện" },
            Completed: { bg: "success", label: "Hoàn thành" },
            Cancelled: { bg: "danger", label: "Đã hủy" },
            "No Show": { bg: "dark", label: "Không đến (No-show)" },
        };
        const item = map[status] || { bg: "secondary", label: status };
        return <Badge bg={item.bg}>{item.label}</Badge>;
    };

    const filteredAppointments = appointments.filter((a) => {
        const kw = searchTerm.trim().toLowerCase();
        const matchKw =
            !kw ||
            a.customerName?.toLowerCase().includes(kw) ||
            a.customerPhone?.toLowerCase().includes(kw) ||
            a.serviceName?.toLowerCase().includes(kw) ||
            a.staffName?.toLowerCase().includes(kw) ||
            String(a.appointmentId).includes(kw);
        const matchStatus = statusFilter === "all" || a.status === statusFilter;
        const matchDate = !dateFilter || a.appointmentDate === dateFilter;
        return matchKw && matchStatus && matchDate;
    });

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <div>
                    <h2 className="fw-bold text-uppercase mb-1" style={{ color: "#800020" }}>
                        Check-in & Điều phối Dịch vụ (Receptionist)
                    </h2>
                    <p className="text-muted mb-0">
                        Tiếp đón khách Check-in, đánh dấu No-show và phân bổ Kỹ thuật viên, Phòng, Giường, Thiết bị.
                    </p>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-danger" onClick={() => navigate("/slots")}>
                        <i className="bi bi-calendar2-week me-1"></i> Xem lịch trống
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => navigate("/appointments/create")}
                    >
                        <i className="bi bi-calendar-plus me-1"></i> Tạo lịch Walk-in
                    </Button>
                </div>
            </div>

            {alertMsg.text && (
                <Alert
                    variant={alertMsg.type}
                    dismissible
                    onClose={() => setAlertMsg({ type: "", text: "" })}
                >
                    {alertMsg.text}
                </Alert>
            )}

            {/* Thanh bộ lọc */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={5}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <i className="bi bi-search"></i>
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Tìm theo mã lịch, tên khách, SĐT, dịch vụ, KTV..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={4}>
                            <Form.Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">-- Tất cả trạng thái --</option>
                                <option value="Booked">Đã đặt (Booked)</option>
                                <option value="Confirmed">Đã xác nhận (Confirmed)</option>
                                <option value="Checked-in">Đã Check-in</option>
                                <option value="In Progress">Đang thực hiện</option>
                                <option value="Completed">Đã hoàn thành</option>
                                <option value="No Show">Không đến (No-show)</option>
                                <option value="Cancelled">Đã hủy</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Control
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Bảng danh sách lịch hẹn */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="danger" />
                        </div>
                    ) : (
                        <Table hover responsive className="align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>Mã</th>
                                    <th>Ngày & Giờ</th>
                                    <th>Khách hàng</th>
                                    <th>Dịch vụ</th>
                                    <th>Kỹ thuật viên</th>
                                    <th>Phòng / Giường</th>
                                    <th>Trạng thái</th>
                                    <th className="text-center">Check-in / Điều phối</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((a) => (
                                        <tr key={a.appointmentId}>
                                            <td className="fw-bold">#{a.appointmentId}</td>
                                            <td>
                                                <div className="fw-semibold">{a.appointmentDate}</div>
                                                <small className="text-muted">
                                                    {a.startTime} - {a.endTime}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{a.customerName}</div>
                                                <small className="text-muted">{a.customerPhone || ""}</small>
                                            </td>
                                            <td>{a.serviceName}</td>
                                            <td>
                                                {a.staffName ? (
                                                    <Badge bg="info">{a.staffName}</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Chưa phân công</Badge>
                                                )}
                                            </td>
                                            <td>
                                                {a.roomName ? (
                                                    <span>
                                                        <strong>{a.roomName}</strong>
                                                        {a.bedNumber ? ` - Giường ${a.bedNumber}` : ""}
                                                    </span>
                                                ) : (
                                                    <span className="text-danger small fw-semibold">
                                                        Chưa xếp phòng/giường
                                                    </span>
                                                )}
                                            </td>
                                            <td>{getStatusBadge(a.status)}</td>
                                            <td className="text-center">
                                                <div className="d-flex flex-wrap justify-content-center gap-1">
                                                    {/* Nút Check-in nhanh */}
                                                    {(a.status === "Booked" ||
                                                        a.status === "Confirmed" ||
                                                        a.status === "Scheduled") && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="success"
                                                                    title="Check-in khách đến"
                                                                    onClick={() =>
                                                                        handleQuickStatusUpdate(
                                                                            a.appointmentId,
                                                                            "Checked-in"
                                                                        )
                                                                    }
                                                                >
                                                                    <i className="bi bi-person-check-fill me-1"></i>
                                                                    Check-in
                                                                </Button>

                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    title="Đánh dấu khách không đến (No-show)"
                                                                    onClick={() =>
                                                                        handleQuickStatusUpdate(a.appointmentId, "No Show")
                                                                    }
                                                                >
                                                                    No-show
                                                                </Button>
                                                            </>
                                                        )}

                                                    {/* Nút Điều phối KTV, Phòng, Giường, Thiết bị */}
                                                    {a.status !== "Cancelled" && a.status !== "No Show" && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => openCoordinateModal(a.appointmentId)}
                                                        >
                                                            <i className="bi bi-sliders me-1"></i>Điều phối
                                                        </Button>
                                                    )}

                                                    {/* Nút Đổi trạng thái chi tiết */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline-dark"
                                                        onClick={() => openStatusModal(a)}
                                                    >
                                                        <i className="bi bi-arrow-repeat me-1"></i>Trạng thái
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Không có lịch hẹn nào phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* MODAL 1: CHECK-IN & CẬP NHẬT TRẠNG THÁI */}
            <Modal
                show={showStatusModal}
                onHide={() => setShowStatusModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        Cập nhật trạng thái Lịch hẹn #{statusTarget?.appointmentId}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {statusTarget && (
                        <>
                            <p className="mb-2">
                                <strong>Khách hàng:</strong> {statusTarget.customerName}
                            </p>
                            <p className="mb-3">
                                <strong>Dịch vụ:</strong> {statusTarget.serviceName}
                            </p>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">Trạng thái mới *</Form.Label>
                                <Form.Select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="Confirmed">Đã xác nhận (Confirmed)</option>
                                    <option value="Checked-in">Khách đã đến (Checked-in)</option>
                                    <option value="In Progress">Đang thực hiện (In Progress)</option>
                                    <option value="Completed">Hoàn thành (Completed)</option>
                                    <option value="No Show">Khách không đến (No Show)</option>
                                    <option value="Cancelled">Hủy lịch (Cancelled)</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label className="fw-bold">Ghi chú Lễ tân</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={statusNotes}
                                    onChange={(e) => setStatusNotes(e.target.value)}
                                    placeholder="Nhập ghi chú khi check-in hoặc lý do vắng mặt..."
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                        Đóng
                    </Button>
                    <Button
                        variant="danger"
                        disabled={savingStatus}
                        onClick={() =>
                            handleQuickStatusUpdate(
                                statusTarget.appointmentId,
                                newStatus,
                                statusNotes
                            )
                        }
                    >
                        {savingStatus ? "Đang lưu..." : "Lưu trạng thái"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* MODAL 2: COORDINATE SERVICE (ĐIỀU PHỐI KTV, PHÒNG, GIƯỜNG, THIẾT BỊ) */}
            <Modal
                show={showCoordModal}
                onHide={() => setShowCoordModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-diagram-3-fill me-2"></i>
                        Điều phối Dịch vụ - Lịch hẹn #{coordData?.appointment?.appointmentId}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveCoordination}>
                    <Modal.Body>
                        {coordLoading ? (
                            <div className="text-center py-4">
                                <Spinner animation="border" variant="danger" />
                                <p className="mt-2 text-muted">
                                    Đang kiểm tra tài nguyên & gợi ý kỹ thuật viên...
                                </p>
                            </div>
                        ) : coordData ? (
                            <>
                                <Card className="bg-light border-0 mb-3">
                                    <Card.Body className="py-2 px-3">
                                        <Row>
                                            <Col md={6}>
                                                <div>
                                                    <strong>Khách hàng:</strong>{" "}
                                                    {coordData.appointment.customerName}
                                                </div>
                                                <div>
                                                    <strong>Dịch vụ:</strong>{" "}
                                                    {coordData.appointment.serviceName}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <div>
                                                    <strong>Ngày hẹn:</strong>{" "}
                                                    {coordData.appointment.appointmentDate}
                                                </div>
                                                <div>
                                                    <strong>Thời gian:</strong>{" "}
                                                    {coordData.appointment.startTime} -{" "}
                                                    {coordData.appointment.endTime}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>

                                <Row className="g-3">
                                    {/* Chọn Kỹ thuật viên (Có gợi ý tự động) */}
                                    <Col md={12}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">
                                                1. Phân công Kỹ thuật viên (Hệ thống tự động gợi ý KTV rảnh & đúng chuyên môn)
                                            </Form.Label>
                                            <Form.Select
                                                value={selectedTechId}
                                                onChange={(e) => setSelectedTechId(e.target.value)}
                                                required
                                            >
                                                <option value="">-- Chọn Kỹ thuật viên --</option>
                                                {coordData.technicians?.map((t) => (
                                                    <option
                                                        key={t.staffId}
                                                        value={t.staffId}
                                                        disabled={!t.isFree}
                                                    >
                                                        {t.fullName}{" "}
                                                        {t.isSuggested
                                                            ? "★ [Gợi ý tốt nhất - Đúng chuyên môn & Đang rảnh]"
                                                            : t.isFree
                                                                ? "[Đang rảnh]"
                                                                : "[Đang bận ca khác]"}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    {/* Chọn Phòng */}
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">2. Chọn Phòng dịch vụ</Form.Label>
                                            <Form.Select
                                                value={selectedRoomId}
                                                onChange={(e) => {
                                                    setSelectedRoomId(e.target.value);
                                                    setSelectedBedId("");
                                                }}
                                            >
                                                <option value="">-- Chọn phòng --</option>
                                                {coordData.roomsWithBeds?.map((r) => (
                                                    <option
                                                        key={r.roomId}
                                                        value={r.roomId}
                                                        disabled={r.status === "Maintenance"}
                                                    >
                                                        {r.roomName} ({r.roomType}) - {r.status}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    {/* Chọn Giường thuộc Phòng */}
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label className="fw-bold">3. Chọn Giường</Form.Label>
                                            <Form.Select
                                                value={selectedBedId}
                                                onChange={(e) => setSelectedBedId(e.target.value)}
                                                disabled={!selectedRoomId}
                                            >
                                                <option value="">-- Chọn giường --</option>
                                                {availableBedsForSelectedRoom.map((b) => (
                                                    <option
                                                        key={b.bedId}
                                                        value={b.bedId}
                                                        disabled={b.status === "Maintenance"}
                                                    >
                                                        Giường {b.bedNumber} ({b.status})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    {/* Chọn Thiết bị đi kèm */}
                                    <Col md={12}>
                                        <Form.Label className="fw-bold">
                                            4. Phân bổ Thiết bị sử dụng
                                        </Form.Label>
                                        <Row className="g-2">
                                            {coordData.equipments?.map((eq) => (
                                                <Col md={6} key={eq.equipmentId}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        id={`eq-${eq.equipmentId}`}
                                                        disabled={eq.status === "Maintenance"}
                                                        checked={selectedEquipmentIds.includes(eq.equipmentId)}
                                                        onChange={() => handleToggleEquipment(eq.equipmentId)}
                                                        label={`${eq.equipmentName} (${eq.status})`}
                                                    />
                                                </Col>
                                            ))}
                                        </Row>
                                    </Col>
                                </Row>
                            </>
                        ) : null}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCoordModal(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="danger" disabled={savingCoord}>
                            {savingCoord ? "Đang lưu..." : "Xác nhận Điều phối"}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ReceptionistBookingDesk;