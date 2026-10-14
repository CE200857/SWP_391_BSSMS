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
  Tabs,
  Tab,
} from "react-bootstrap";

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("coordination");

  // --- STATE CHO CHECK-IN & COORDINATE SERVICE ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [alertMsg, setAlertMsg] = useState({ type: "", text: "" });

  // Modal Check-in & Status Update
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("Checked-in");
  const [statusNotes, setStatusNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Modal Coordinate Service (KTV, Phòng, Giường, Thiết bị)
  const [showCoordModal, setShowCoordModal] = useState(false);
  const [coordLoading, setCoordLoading] = useState(false);
  const [coordData, setCoordData] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [savingCoord, setSavingCoord] = useState(false);

  // --- STATE CHO CHECK SLOT AVAILABILITY ---
  const [services, setServices] = useState([]);
  const [slotServiceId, setSlotServiceId] = useState("");
  const [slotDate, setSlotDate] = useState(getTodayString());
  const [slotTechId, setSlotTechId] = useState("");
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

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
      console.error("Lỗi tải danh sách lịch hẹn:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    fetch("/api/service", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const active = Array.isArray(data)
          ? data.filter((s) => s.status?.toLowerCase() === "active")
          : [];
        setServices(active);
        if (active.length > 0) setSlotServiceId(String(active[0].serviceId));
      })
      .catch((err) => console.error("Lỗi tải dịch vụ:", err));
  }, []);

  // Tự động tra cứu lịch trống khi ở Tab Check Slot Availability
  useEffect(() => {
    if (!slotServiceId || !slotDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          serviceId: slotServiceId,
          date: slotDate,
        });
        if (slotTechId) params.append("technicianId", slotTechId);

        const res = await fetch(`/api/booking/slots?${params.toString()}`, {
          credentials: "include",
        });
        if (res.ok) {
          setSlotData(await res.json());
        }
      } catch (err) {
        console.error("Lỗi tải lịch trống:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [slotServiceId, slotDate, slotTechId]);

  // --- 1. HÀM XỬ LÝ CHECK-IN & STATUS UPDATE ---
  const handleQuickStatusUpdate = async (
    appointmentId,
    statusValue,
    customNotes = null
  ) => {
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
        loadAppointments();
      } else {
        setAlertMsg({
          type: "danger",
          text: data.message || "Cập nhật trạng thái thất bại!",
        });
      }
    } catch (err) {
      setAlertMsg({ type: "danger", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setSavingStatus(false);
    }
  };

  const openStatusModal = (appt) => {
    setStatusTarget(appt);
    setNewStatus(
      appt.status === "Booked" || appt.status === "Confirmed"
        ? "Checked-in"
        : appt.status
    );
    setStatusNotes(appt.notes || "");
    setShowStatusModal(true);
  };

  // --- 2. HÀM XỬ LÝ COORDINATE SERVICE ---
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
        loadAppointments();
      } else {
        setAlertMsg({
          type: "danger",
          text: data.message || "Điều phối thất bại!",
        });
      }
    } catch (err) {
      setAlertMsg({ type: "danger", text: "Lỗi kết nối máy chủ!" });
    } finally {
      setSavingCoord(false);
    }
  };

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
            Bảng điều khiển Lễ Tân (Receptionist)
          </h2>
          <p className="text-muted mb-0">
            Tiếp nhận khách Check-in, đánh dấu No-show, điều phối Kỹ thuật viên / Phòng / Giường / Thiết bị và tra cứu lịch trống.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button
            variant="outline-danger"
            onClick={() => navigate("/receptionist/create-walkin")}
          >
            <i className="bi bi-person-plus-fill me-1"></i> Tạo khách vãng lai
          </Button>
          <Button
            variant="danger"
            onClick={() => navigate("/appointments/create")}
          >
            <i className="bi bi-calendar-plus me-1"></i> Tạo lịch hẹn Walk-in
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

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 fw-bold"
      >
        {/* TAB 1: CHECK-IN & STATUS UPDATE + COORDINATE SERVICE */}
        <Tab
          eventKey="coordination"
          title={
            <span>
              <i className="bi bi-sliders me-2"></i>Check-in & Điều phối Dịch vụ
            </span>
          }
        >
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
                            <small className="text-muted">
                              {a.customerPhone || ""}
                            </small>
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
                              {(a.status === "Booked" ||
                                a.status === "Confirmed" ||
                                a.status === "Scheduled") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="success"
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
                                    onClick={() =>
                                      handleQuickStatusUpdate(
                                        a.appointmentId,
                                        "No Show"
                                      )
                                    }
                                  >
                                    No-show
                                  </Button>
                                </>
                              )}

                              {a.status !== "Cancelled" &&
                                a.status !== "No Show" && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() =>
                                      openCoordinateModal(a.appointmentId)
                                    }
                                  >
                                    <i className="bi bi-sliders me-1"></i>Điều phối
                                  </Button>
                                )}

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
        </Tab>

        {/* TAB 2: CHECK SLOT AVAILABILITY */}
        <Tab
          eventKey="slots"
          title={
            <span>
              <i className="bi bi-calendar2-week me-2"></i>Tra cứu Lịch trống (Check Slot Availability)
            </span>
          }
        >
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <Row className="g-3 mb-4">
                <Col md={5}>
                  <Form.Label className="fw-bold">Chọn dịch vụ</Form.Label>
                  <Form.Select
                    value={slotServiceId}
                    onChange={(e) => setSlotServiceId(e.target.value)}
                  >
                    {services.map((s) => (
                      <option key={s.serviceId} value={s.serviceId}>
                        {s.serviceName} ({s.duration} phút)
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-bold">Ngày hẹn</Form.Label>
                  <Form.Control
                    type="date"
                    min={getTodayString()}
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="fw-bold">Kỹ thuật viên</Form.Label>
                  <Form.Select
                    value={slotTechId}
                    onChange={(e) => setSlotTechId(e.target.value)}
                  >
                    <option value="">-- Tất cả KTV --</option>
                    {slotData?.technicians?.map((t) => (
                      <option key={t.staffId} value={t.staffId}>
                        {t.fullName}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {loadingSlots ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="danger" />
                </div>
              ) : (
                <Row className="g-3">
                  {slotData?.slots?.map((slot) => (
                    <Col key={slot.startTime} xs={6} sm={4} md={3} lg={2}>
                      <Card
                        className={`h-100 text-center border ${
                          slot.available
                            ? "border-success shadow-sm"
                            : "bg-light opacity-75"
                        }`}
                      >
                        <Card.Body className="p-3">
                          <div className="fw-bold">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <Badge
                            bg={slot.available ? "success" : "secondary"}
                            className="my-2"
                          >
                            {slot.available
                              ? `Trống (${slot.availableTechnicianCount} KTV)`
                              : "Kín lịch"}
                          </Badge>
                          {slot.available && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="w-100"
                              onClick={() => {
                                sessionStorage.setItem(
                                  "bssms.walkInAppointmentDraft",
                                  JSON.stringify({
                                    formData: {
                                      customerId: "",
                                      serviceId: String(slotServiceId),
                                      appointmentDate: slotDate,
                                      startTime: slot.startTime,
                                      technicianId: slotTechId || "",
                                      notes: "",
                                    },
                                    customerSearch: "",
                                  })
                                );
                                navigate("/appointments/create");
                              }}
                            >
                              Tạo lịch giờ này →
                            </Button>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* MODAL CHECK-IN & STATUS UPDATE */}
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

      {/* MODAL COORDINATE SERVICE */}
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
              </div>
            ) : coordData ? (
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      1. Phân công Kỹ thuật viên (Gợi ý tự động theo kỹ năng & ca rảnh)
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

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">2. Chọn Phòng</Form.Label>
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

                <Col md={12}>
                  <Form.Label className="fw-bold">
                    4. Thiết bị sử dụng
                  </Form.Label>
                  <Row className="g-2">
                    {coordData.equipments?.map((eq) => (
                      <Col md={6} key={eq.equipmentId}>
                        <Form.Check
                          type="checkbox"
                          id={`desk-eq-${eq.equipmentId}`}
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
}