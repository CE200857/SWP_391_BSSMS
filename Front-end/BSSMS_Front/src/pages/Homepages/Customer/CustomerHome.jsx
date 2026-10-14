/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Alert,
  Spinner,
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

export default function CustomerHome() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [activeTab, setActiveTab] = useState("book-online");

  // State chung cho danh sách dịch vụ & gói liệu trình của khách
  const [services, setServices] = useState([]);
  const [myPackages, setMyPackages] = useState([]);

  // State cho Đặt lịch Online & Kiểm tra Slot
  const [bookingType, setBookingType] = useState("single"); // 'single' | 'package'
  const [serviceId, setServiceId] = useState("");
  const [customerPackageId, setCustomerPackageId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(getTodayString());
  const [technicianId, setTechnicianId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const [slotInfo, setSlotInfo] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  // Tải danh sách dịch vụ và gói liệu trình còn buổi của Customer
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [srvRes, pkgRes] = await Promise.all([
          fetch("/api/service", { credentials: "include" }),
          fetch("/api/booking/my-packages", { credentials: "include" }),
        ]);

        if (srvRes.ok) {
          const srvData = await srvRes.json();
          const activeList = Array.isArray(srvData)
            ? srvData.filter((s) => s.status?.toLowerCase() === "active")
            : [];
          setServices(activeList);
          if (activeList.length > 0) {
            setServiceId(String(activeList[0].serviceId));
          }
        }

        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          setMyPackages(Array.isArray(pkgData) ? pkgData : []);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu trang chủ khách hàng:", err);
      }
    };
    loadInitialData();
  }, []);

  // Tự động kiểm tra lịch trống (Check Slot Availability) khi thay đổi Dịch vụ, Ngày hoặc KTV
  useEffect(() => {
    if (!serviceId || !appointmentDate) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          serviceId,
          date: appointmentDate,
        });
        if (technicianId) {
          params.append("technicianId", technicianId);
        }

        const res = await fetch(`/api/booking/slots?${params.toString()}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSlotInfo(data);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra lịch trống:", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [serviceId, appointmentDate, technicianId]);

  const handleSelectPackage = (pkgId) => {
    setCustomerPackageId(pkgId);
    const found = myPackages.find(
      (p) => String(p.customerPackageId) === String(pkgId)
    );
    if (found) {
      setServiceId(String(found.serviceId));
      setStartTime("");
    }
  };

  const selectedService = services.find(
    (s) => String(s.serviceId) === String(serviceId)
  );

  // Xử lý Đặt lịch hẹn Online (Create Online Appointment)
  const handleCreateOnlineAppointment = async (e) => {
    e.preventDefault();
    setError("");
    setBookingResult(null);

    if (!serviceId || !appointmentDate || !startTime) {
      setError("Vui lòng chọn dịch vụ, ngày hẹn và một khung giờ còn trống!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/booking/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          serviceId: Number(serviceId),
          customerPackageId:
            bookingType === "package" && customerPackageId
              ? Number(customerPackageId)
              : null,
          appointmentDate,
          startTime,
          technicianId: technicianId ? Number(technicianId) : null,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookingResult(data);
        setStartTime("");
        setNotes("");
      } else {
        setError(data.message || "Không thể đặt lịch hẹn online.");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ khi đặt lịch hẹn online.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container fluid className="mt-4 px-4">
      {/* Banner chào mừng Khách hàng */}
      <Card
        className="border-0 shadow-sm mb-4 text-white"
        style={{
          background: "linear-gradient(120deg, #800020 0%, #a61e4d 60%, #d6336c 100%)",
          borderRadius: "16px",
        }}
      >
        <Card.Body className="p-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h2 className="fw-bold mb-1">
              Xin chào, {user?.fullName || "Quý khách"}!
            </h2>
            <p className="mb-0 text-white-50">
              Chào mừng bạn đến với hệ thống đặt lịch làm đẹp & chăm sóc da Seoul Center.
            </p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="light"
              className="fw-bold text-danger"
              onClick={() => navigate("/appointments")}
            >
              <i className="bi bi-calendar-check me-1"></i> Lịch hẹn của tôi
            </Button>
            <Button
              variant="outline-light"
              className="fw-bold"
              onClick={() => navigate("/my-feedback")}
            >
              <i className="bi bi-star me-1"></i> Đánh giá của tôi
            </Button>
          </div>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {bookingResult && (
        <Alert variant="success" className="shadow-sm mb-4">
          <Alert.Heading className="fw-bold">
            <i className="bi bi-check-circle-fill me-2"></i>
            Đặt lịch hẹn Online thành công!
          </Alert.Heading>
          <p className="mb-1">
            Mã lịch hẹn: <strong>#{bookingResult.appointmentId}</strong> | Ngày:{" "}
            <strong>{bookingResult.appointmentDate}</strong> | Giờ:{" "}
            <strong>
              {bookingResult.startTime} - {bookingResult.endTime}
            </strong>
          </p>
          <p className="mb-2">
            Kỹ thuật viên phụ trách:{" "}
            <strong>{bookingResult.technicianName}</strong> | Trạng thái:{" "}
            <Badge bg="primary">{bookingResult.status}</Badge>
          </p>
          <Button
            size="sm"
            variant="success"
            onClick={() =>
              navigate(`/appointments/${bookingResult.appointmentId}`)
            }
          >
            Xem chi tiết lịch hẹn
          </Button>
        </Alert>
      )}

      {/* Tabs chuyển đổi giữa Đặt lịch Online và Tra cứu lịch trống */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 fw-bold"
      >
        {/* TAB 1: CREATE ONLINE APPOINTMENT */}
        <Tab
          eventKey="book-online"
          title={
            <span>
              <i className="bi bi-calendar-heart me-2"></i>Đặt lịch hẹn Online (Create Online Appointment)
            </span>
          }
        >
          <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
            <Card.Body className="p-4">
              <Form onSubmit={handleCreateOnlineAppointment}>
                <h5 className="fw-bold mb-3">1. Chọn hình thức dịch vụ</h5>
                <div className="d-flex flex-wrap gap-4 mb-3">
                  <Form.Check
                    type="radio"
                    id="cus-single"
                    label="Đặt dịch vụ lẻ (Tính theo lượt)"
                    checked={bookingType === "single"}
                    onChange={() => {
                      setBookingType("single");
                      setCustomerPackageId("");
                    }}
                    className="fw-semibold"
                  />
                  <Form.Check
                    type="radio"
                    id="cus-package"
                    label={`Dùng gói liệu trình đã mua (${myPackages.length} gói khả dụng)`}
                    checked={bookingType === "package"}
                    onChange={() => setBookingType("package")}
                    disabled={myPackages.length === 0}
                    className="fw-semibold"
                  />
                </div>

                <Row className="g-3 mb-4">
                  {bookingType === "package" ? (
                    <Col md={12}>
                      <Form.Label className="fw-bold">
                        Gói liệu trình của bạn *
                      </Form.Label>
                      <Form.Select
                        value={customerPackageId}
                        onChange={(e) => handleSelectPackage(e.target.value)}
                        required
                      >
                        <option value="">-- Chọn gói liệu trình --</option>
                        {myPackages.map((pkg) => (
                          <option
                            key={pkg.customerPackageId}
                            value={pkg.customerPackageId}
                          >
                            {pkg.packageName} - Dịch vụ: {pkg.serviceName} (Còn{" "}
                            {pkg.remainingSessions} buổi)
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  ) : (
                    <>
                      <Col md={6}>
                        <Form.Label className="fw-bold">
                          Chọn dịch vụ *
                        </Form.Label>
                        <Form.Select
                          value={serviceId}
                          onChange={(e) => {
                            setServiceId(e.target.value);
                            setStartTime("");
                          }}
                          required
                        >
                          {services.map((s) => (
                            <option key={s.serviceId} value={s.serviceId}>
                              {s.serviceName}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="fw-bold">Thời lượng</Form.Label>
                        <Form.Control
                          readOnly
                          value={
                            selectedService
                              ? `${selectedService.duration} phút`
                              : ""
                          }
                        />
                      </Col>
                      <Col md={3}>
                        <Form.Label className="fw-bold">Đơn giá</Form.Label>
                        <Form.Control
                          readOnly
                          value={
                            selectedService
                              ? `${Number(selectedService.price).toLocaleString(
                                  "vi-VN"
                                )} ₫`
                              : ""
                          }
                        />
                      </Col>
                    </>
                  )}
                </Row>

                <h5 className="fw-bold mb-3">2. Chọn Ngày & Kỹ thuật viên</h5>
                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Label className="fw-bold">Ngày hẹn *</Form.Label>
                    <Form.Control
                      type="date"
                      min={getTodayString()}
                      value={appointmentDate}
                      onChange={(e) => {
                        setAppointmentDate(e.target.value);
                        setStartTime("");
                      }}
                      required
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="fw-bold">
                      Kỹ thuật viên (Tùy chọn)
                    </Form.Label>
                    <Form.Select
                      value={technicianId}
                      onChange={(e) => {
                        setTechnicianId(e.target.value);
                        setStartTime("");
                      }}
                    >
                      <option value="">Tự động phân công KTV rảnh</option>
                      {slotInfo?.technicians?.map((t) => (
                        <option key={t.staffId} value={t.staffId}>
                          {t.fullName}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>

                <h5 className="fw-bold mb-3">
                  3. Chọn khung giờ còn trống *{" "}
                  {startTime && (
                    <Badge bg="danger" className="ms-2">
                      Đã chọn: {startTime}
                    </Badge>
                  )}
                </h5>

                {loadingSlots ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="danger" />
                    <span className="ms-2 text-muted">
                      Đang kiểm tra lịch trống...
                    </span>
                  </div>
                ) : (
                  <Row className="g-2 mb-4">
                    {slotInfo?.slots?.map((slot) => {
                      const isSelected = startTime === slot.startTime;
                      return (
                        <Col
                          key={slot.startTime}
                          xs={6}
                          sm={4}
                          md={3}
                          lg={2}
                        >
                          <Button
                            type="button"
                            variant={
                              isSelected
                                ? "danger"
                                : slot.available
                                ? "outline-success"
                                : "outline-secondary"
                            }
                            className="w-100 py-2"
                            disabled={!slot.available}
                            onClick={() => setStartTime(slot.startTime)}
                          >
                            <div className="fw-bold">
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <small>
                              {slot.available
                                ? `Còn ${slot.availableTechnicianCount} KTV`
                                : "Hết chỗ"}
                            </small>
                          </Button>
                        </Col>
                      );
                    })}
                  </Row>
                )}

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">
                    4. Ghi chú cho Spa / Kỹ thuật viên
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    maxLength={500}
                    placeholder="Nhập lưu ý về tình trạng da hoặc yêu cầu cá nhân..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button
                    type="submit"
                    variant="danger"
                    className="px-4 py-2 fw-bold"
                    disabled={submitting || !startTime}
                  >
                    {submitting ? "Đang xử lý..." : "Xác nhận Đặt lịch Online"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        {/* TAB 2: CHECK SLOT AVAILABILITY */}
        <Tab
          eventKey="check-slots"
          title={
            <span>
              <i className="bi bi-calendar2-week me-2"></i>Tra cứu Lịch trống chi tiết (Check Slot Availability)
            </span>
          }
        >
          <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
            <Card.Body className="p-4">
              <Row className="g-3 mb-4">
                <Col md={5}>
                  <Form.Label className="fw-bold">Dịch vụ</Form.Label>
                  <Form.Select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                  >
                    {services.map((s) => (
                      <option key={s.serviceId} value={s.serviceId}>
                        {s.serviceName} ({s.duration} phút)
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-bold">Ngày kiểm tra</Form.Label>
                  <Form.Control
                    type="date"
                    min={getTodayString()}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="fw-bold">Kỹ thuật viên</Form.Label>
                  <Form.Select
                    value={technicianId}
                    onChange={(e) => setTechnicianId(e.target.value)}
                  >
                    <option value="">-- Tất cả KTV --</option>
                    {slotInfo?.technicians?.map((t) => (
                      <option key={t.staffId} value={t.staffId}>
                        {t.fullName}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              <Row className="g-3">
                {slotInfo?.slots?.map((slot) => (
                  <Col key={slot.startTime} xs={6} sm={4} md={3}>
                    <Card
                      className={`h-100 border ${
                        slot.available ? "border-success" : "bg-light opacity-75"
                      }`}
                    >
                      <Card.Body className="text-center p-3">
                        <div className="fw-bold fs-5">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <Badge
                          bg={slot.available ? "success" : "secondary"}
                          className="my-2"
                        >
                          {slot.available ? "Còn trống" : "Đã kín"}
                        </Badge>
                        {slot.available && (
                          <>
                            <div className="small text-muted mb-2">
                              {slot.availableTechnicianCount} KTV rảnh |{" "}
                              {slot.freeRooms} phòng trống
                            </div>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                setStartTime(slot.startTime);
                                setActiveTab("book-online");
                              }}
                            >
                              Chọn giờ này →
                            </Button>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}