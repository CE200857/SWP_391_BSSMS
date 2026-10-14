import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const CreateOnlineAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state || {};

  const [bookingType, setBookingType] = useState("single"); // 'single' | 'package'
  const [services, setServices] = useState([]);
  const [myPackages, setMyPackages] = useState([]);

  const [serviceId, setServiceId] = useState(prefill.serviceId || "");
  const [customerPackageId, setCustomerPackageId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    prefill.appointmentDate || getTodayString()
  );
  const [startTime, setStartTime] = useState(prefill.startTime || "");
  const [technicianId, setTechnicianId] = useState(prefill.technicianId || "");
  const [notes, setNotes] = useState("");

  const [slotInfo, setSlotInfo] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  // Tải danh sách dịch vụ và gói liệu trình còn buổi của Customer
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const [srvRes, pkgRes] = await Promise.all([
          fetch("/api/service", { credentials: "include" }),
          fetch("/api/booking/my-packages", { credentials: "include" }),
        ]);

        if (srvRes.ok) {
          const srvData = await srvRes.json();
          const activeSrvs = Array.isArray(srvData)
            ? srvData.filter((s) => s.status?.toLowerCase() === "active")
            : [];
          setServices(activeSrvs);
          if (!serviceId && activeSrvs.length > 0) {
            setServiceId(String(activeSrvs[0].serviceId));
          }
        }

        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          setMyPackages(Array.isArray(pkgData) ? pkgData : []);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu đặt lịch online:", err);
      }
    };
    loadInitial();
  }, []);

  // Khi chọn gói liệu trình -> tự động gán serviceId tương ứng của gói đó
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

  // Tải danh sách khung giờ trống mỗi khi đổi dịch vụ, ngày hoặc kỹ thuật viên
  useEffect(() => {
    if (!serviceId || !appointmentDate) return;

    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const params = new URLSearchParams({
          serviceId,
          date: appointmentDate,
        });
        if (technicianId) params.append("technicianId", technicianId);

        const res = await fetch(`/api/booking/slots?${params.toString()}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSlotInfo(data);
        }
      } catch (err) {
        console.error("Lỗi tải khung giờ:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [serviceId, appointmentDate, technicianId]);

  const selectedService = services.find(
    (s) => String(s.serviceId) === String(serviceId)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBookingResult(null);

    if (!serviceId || !appointmentDate || !startTime) {
      setError("Vui lòng chọn dịch vụ, ngày hẹn và một khung giờ còn trống!");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/booking/online", {
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

      const data = await response.json();
      if (response.ok) {
        setBookingResult(data);
      } else {
        setError(data.message || "Đặt lịch hẹn thất bại!");
      }
    } catch (err) {
      setError("Lỗi kết nối máy chủ khi đặt lịch hẹn!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-uppercase mb-1" style={{ color: "#800020" }}>
            <i className="bi bi-calendar-heart me-2"></i>Đặt lịch hẹn Online
          </h2>
          <p className="text-muted mb-0">
            Chọn dịch vụ lẻ hoặc gói liệu trình của bạn và khung giờ yêu thích.
          </p>
        </div>
        <Button variant="outline-secondary" onClick={() => navigate("/appointments")}>
          <i className="bi bi-list-ul me-1"></i> Lịch hẹn của tôi
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {bookingResult && (
        <Alert variant="success" className="shadow-sm">
          <Alert.Heading className="fw-bold">
            <i className="bi bi-check-circle-fill me-2"></i>Đặt lịch hẹn thành công!
          </Alert.Heading>
          <p className="mb-1">
            Mã lịch hẹn: <strong>#{bookingResult.appointmentId}</strong> | Trạng thái:{" "}
            <Badge bg="primary">{bookingResult.status}</Badge>
          </p>
          <p className="mb-2">
            Ngày hẹn: <strong>{bookingResult.appointmentDate}</strong> | Khung giờ:{" "}
            <strong>
              {bookingResult.startTime} - {bookingResult.endTime}
            </strong>{" "}
            | Kỹ thuật viên: <strong>{bookingResult.technicianName}</strong>
          </p>
          <div className="d-flex gap-2 mt-3">
            <Button
              variant="success"
              onClick={() => navigate(`/appointments/${bookingResult.appointmentId}`)}
            >
              Xem chi tiết lịch hẹn
            </Button>
            <Button variant="outline-success" onClick={() => navigate("/appointments")}>
              Danh sách lịch hẹn
            </Button>
          </div>
        </Alert>
      )}

      <Card className="shadow-sm border-0" style={{ borderRadius: "15px" }}>
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit}>
            {/* Bước 1: Chọn hình thức đặt lịch */}
            <h5 className="fw-bold mb-3">1. Hình thức sử dụng dịch vụ</h5>
            <div className="d-flex gap-3 mb-4">
              <Form.Check
                type="radio"
                id="type-single"
                label="Sử dụng dịch vụ lẻ (Tính theo lượt)"
                checked={bookingType === "single"}
                onChange={() => {
                  setBookingType("single");
                  setCustomerPackageId("");
                }}
                className="fw-semibold"
              />
              <Form.Check
                type="radio"
                id="type-package"
                label={`Sử dụng gói liệu trình đã mua (${myPackages.length} gói khả dụng)`}
                checked={bookingType === "package"}
                onChange={() => setBookingType("package")}
                disabled={myPackages.length === 0}
                className="fw-semibold"
              />
            </div>

            <Row className="g-3 mb-4">
              {bookingType === "package" ? (
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Chọn gói liệu trình của bạn *</Form.Label>
                    <Form.Select
                      value={customerPackageId}
                      onChange={(e) => handleSelectPackage(e.target.value)}
                      required
                    >
                      <option value="">-- Chọn gói liệu trình --</option>
                      {myPackages.map((pkg) => (
                        <option key={pkg.customerPackageId} value={pkg.customerPackageId}>
                          {pkg.packageName} - Dịch vụ: {pkg.serviceName} (Còn{" "}
                          {pkg.remainingSessions} buổi)
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              ) : (
                <>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Dịch vụ làm đẹp *</Form.Label>
                      <Form.Select
                        value={serviceId}
                        onChange={(e) => {
                          setServiceId(e.target.value);
                          setStartTime("");
                        }}
                        required
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        {services.map((s) => (
                          <option key={s.serviceId} value={s.serviceId}>
                            {s.serviceName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Label className="fw-bold">Thời lượng</Form.Label>
                    <Form.Control
                      readOnly
                      value={selectedService ? `${selectedService.duration} phút` : ""}
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Label className="fw-bold">Chi phí dự kiến</Form.Label>
                    <Form.Control
                      readOnly
                      value={
                        selectedService
                          ? `${Number(selectedService.price).toLocaleString("vi-VN")} ₫`
                          : ""
                      }
                    />
                  </Col>
                </>
              )}
            </Row>

            {/* Bước 2: Chọn Ngày & Kỹ thuật viên */}
            <h5 className="fw-bold mb-3">2. Chọn Ngày & Kỹ thuật viên</h5>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <Form.Group>
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
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Kỹ thuật viên yêu thích</Form.Label>
                  <Form.Select
                    value={technicianId}
                    onChange={(e) => {
                      setTechnicianId(e.target.value);
                      setStartTime("");
                    }}
                  >
                    <option value="">Tự động chọn KTV tốt nhất</option>
                    {slotInfo?.technicians?.map((t) => (
                      <option key={t.staffId} value={t.staffId}>
                        {t.fullName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Bước 3: Chọn khung giờ trống */}
            <h5 className="fw-bold mb-3">
              3. Chọn khung giờ trống *{" "}
              {startTime && (
                <Badge bg="danger" className="ms-2">
                  Đã chọn: {startTime}
                </Badge>
              )}
            </h5>

            {loadingSlots ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" variant="danger" />
                <span className="ms-2 text-muted">Đang kiểm tra lịch trống...</span>
              </div>
            ) : (
              <Row className="g-2 mb-4">
                {slotInfo?.slots?.map((slot) => {
                  const isSelected = startTime === slot.startTime;
                  return (
                    <Col key={slot.startTime} xs={6} sm={4} md={3} lg={2}>
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
                            : "Kín lịch"}
                        </small>
                      </Button>
                    </Col>
                  );
                })}
              </Row>
            )}

            {/* Bước 4: Ghi chú */}
            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">4. Ghi chú tình trạng da / Yêu cầu thêm</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={500}
                placeholder="Nhập lưu ý về làn da, dị ứng mỹ phẩm hoặc yêu cầu đặc biệt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/slots")}
                disabled={submitting}
              >
                Xem bảng lịch trống
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="px-4 fw-bold"
                disabled={submitting || !startTime}
              >
                {submitting ? "Đang đặt lịch..." : "Xác nhận Đặt lịch Online"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CreateOnlineAppointment;