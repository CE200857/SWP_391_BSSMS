import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Card,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Spinner,
  Alert,
} from "react-bootstrap";

const getTodayString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const CheckSlotAvailability = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || "Guest";

  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(() => new URLSearchParams(location.search).get("serviceId") || "");
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [selectedTechId, setSelectedTechId] = useState("");

  const [slotData, setSlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải danh sách dịch vụ đang hoạt động
  useEffect(() => {
    if (!user) return;
    const loadServices = async () => {
      try {
        const res = await fetch("/api/service", { credentials: "include" });
        if (!res.ok) {
          throw new Error(`Không thể tải danh sách dịch vụ (${res.status}).`);
        }

        const data = await res.json();
        const activeList = Array.isArray(data)
          ? data.filter((s) => s.status?.toLowerCase() === "active")
          : [];
        setServices(activeList);
        if (activeList.length > 0) {
          setSelectedServiceId((currentServiceId) =>
            activeList.some(service => String(service.serviceId) === currentServiceId) ? currentServiceId : String(activeList[0].serviceId)
          );
        }
      } catch (err) {
        console.error("Lỗi tải danh sách dịch vụ:", err);
        setError("Không thể tải danh sách dịch vụ. Vui lòng thử lại.");
      }
    };
    loadServices();
  }, [user]);

  // Tự động tra cứu lịch trống khi thay đổi Dịch vụ, Ngày hoặc KTV
  useEffect(() => {
    if (!user || !selectedServiceId || !selectedDate) return;
    const controller = new AbortController();
    let cancelled = false;

    const fetchSlots = async () => {
      setLoading(true);
      setSlotData(null);
      setError("");
      try {
        const params = new URLSearchParams({
          serviceId: selectedServiceId,
          date: selectedDate,
        });
        if (selectedTechId) {
          params.append("technicianId", selectedTechId);
        }

        const res = await fetch(`/api/booking/slots?${params.toString()}`, {
          signal: controller.signal, credentials: "include",
        });
        if (cancelled) return;
        if (res.status === 401) {
          localStorage.removeItem('user');
          setUser(null);
          navigate(user.role === 'Customer' ? '/login' : '/dashboard/login', {
            replace: true, state: { from: '/slots?serviceId=' + encodeURIComponent(selectedServiceId) },
          });
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (res.ok) {
          setSlotData(data);
        } else {
          setError(data.message || "Không thể kiểm tra lịch trống.");
        }
      } catch (err) {
        if (cancelled || err.name === "AbortError") return;
        console.error("Lỗi kiểm tra lịch trống:", err);
        setError("Lỗi kết nối máy chủ khi kiểm tra lịch trống.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSlots();
    return () => { cancelled = true; controller.abort(); };
  }, [user, setUser, navigate, selectedServiceId, selectedDate, selectedTechId]);

  const handleSelectSlot = (slot) => {
    if (!slot.available) return;

    const chosenSlot = {
      serviceId: String(selectedServiceId),
      appointmentDate: selectedDate,
      startTime: slot.startTime,
      technicianId: selectedTechId || "",
    };

    if (role === "Customer") {
      navigate("/appointments/online", { state: chosenSlot });
    } else if (role === "Receptionist" || role === "Manager") {
      sessionStorage.setItem(
        "bssms.walkInAppointmentDraft",
        JSON.stringify({
          formData: {
            customerId: "",
            ...chosenSlot,
            notes: "",
          },
          customerSearch: "",
        })
      );
      navigate("/appointments/create");
    }
  };

  const isPublicRoute = role === "Guest" || role === "Customer";
  const selectedService = services.find(
    (service) => String(service.serviceId) === String(selectedServiceId)
  );

  if (!user) return <Navigate to="/login" state={{ from: "/slots" + location.search }} replace />;

  if (isPublicRoute) {
    return (
      <main className="public-slot-page">
        <section className="customer-page-banner public-slot-banner">
          <div className="customer-page-container">
            <div className="customer-breadcrumb">
              <button type="button" onClick={() => navigate(role === "Customer" ? "/customer/home" : "/bssms-guest")}>
                Trang chủ
              </button>
              <i className="bi bi-chevron-right" aria-hidden="true" />
              <strong>Tra cứu lịch trống</strong>
            </div>
            <div className="public-slot-banner-row">
              <div>
                <span className="home-eyebrow">DÀNH MỘT KHOẢNG THỜI GIAN CHO BẠN</span>
                <h1>Tra cứu lịch trống</h1>
                <p>Chọn dịch vụ, ngày hẹn và kỹ thuật viên bạn mong muốn.<br />Tìm khung giờ phù hợp để bắt đầu buổi chăm sóc tại Seoul Center.</p>
              </div>
              <div className="customer-summary-card public-slot-summary">
                <span><i className="bi bi-calendar2-check" aria-hidden="true" /> Khung giờ ngày {selectedDate}</span>
                <strong>{slotData?.slots?.filter((slot) => slot.available).length ?? "—"}</strong>
                <small>khung giờ còn trống</small>
              </div>
            </div>
          </div>
        </section>

        <div className="customer-page-container public-slot-content">
          {error && <Alert variant="danger">{error}</Alert>}
          <section className="public-slot-filter-panel">
            <div className="customer-filter-title">
              <strong><i className="bi bi-sliders" aria-hidden="true" /> Tìm khung giờ dành cho bạn</strong>
              <small>* Thông tin bắt buộc</small>
            </div>
            <div className="public-slot-filter-fields">
              <Form.Group>
                <Form.Label>Chọn dịch vụ *</Form.Label>
                <Form.Select
                  value={selectedServiceId}
                  onChange={(event) => {
                    setSelectedServiceId(event.target.value);
                    setSelectedTechId("");
                  }}
                  required
                >
                  <option value="">-- Chọn dịch vụ --</option>
                  {services.map((service) => (
                    <option key={service.serviceId} value={service.serviceId}>
                      {service.serviceName} ({service.duration} phút · {Number(service.price).toLocaleString("vi-VN")} đ)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group>
                <Form.Label>Ngày hẹn *</Form.Label>
                <Form.Control
                  type="date"
                  min={getTodayString()}
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Kỹ thuật viên (Tùy chọn)</Form.Label>
                <Form.Select
                  value={selectedTechId}
                  onChange={(event) => setSelectedTechId(event.target.value)}
                >
                  <option value="">Tất cả kỹ thuật viên</option>
                  {slotData?.technicians?.map((technician) => (
                    <option key={technician.staffId} value={technician.staffId}>
                      {technician.fullName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </section>

          {loading ? (
            <div className="customer-empty-state public-slot-loading" role="status">
              <Spinner animation="border" variant="danger" />
              <strong>Đang tìm khung giờ phù hợp...</strong>
            </div>
          ) : slotData ? (
            <section className="public-slot-results">
              <div className="public-slot-results-heading">
                <div>
                  <h2>Khung giờ dành cho bạn <span>{slotData.slots?.filter((slot) => slot.available).length || 0} khung giờ</span></h2>
                  <strong>{slotData.serviceName || selectedService?.serviceName}</strong>
                  <small><i className="bi bi-calendar3" aria-hidden="true" /> {selectedDate} <i className="bi bi-clock" aria-hidden="true" /> Thời lượng: {slotData.duration || selectedService?.duration} phút</small>
                </div>
                <div className="public-slot-legend">
                  <span><i className="is-available" /> Còn chỗ trống</span>
                  <span><i className="is-unavailable" /> Đã kín lịch</span>
                </div>
              </div>

              {slotData.slots?.length ? (
                <div className="public-slot-grid">
                  {slotData.slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      className={`public-slot-card${slot.available ? "" : " is-unavailable"}`}
                      disabled={!slot.available}
                      onClick={() => handleSelectSlot(slot)}
                    >
                      <strong>{slot.startTime}–{slot.endTime}</strong>
                      <span className="public-slot-status">{slot.available ? "Còn trống" : "Đã kín"}</span>
                      <small><i className="bi bi-person" aria-hidden="true" /> {slot.availableTechnicianCount} kỹ thuật viên rảnh</small>
                      {slot.available && <span className="public-slot-cta">{role === "Guest" ? "Đăng nhập để đặt" : "Nhấn để đặt lịch online"} <i className="bi bi-arrow-right" aria-hidden="true" /></span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="customer-empty-state">
                  <i className="bi bi-calendar-x" aria-hidden="true" />
                  <strong>Không có khung giờ phù hợp</strong>
                  <span>Thử chọn ngày hoặc kỹ thuật viên khác.</span>
                </div>
              )}
              <div className="public-slot-footer-note">
                <span>Bạn đang xem tất cả khung giờ trong ngày đã chọn.</span>
                <span>Chọn một khung giờ trống để đặt lịch online.</span>
              </div>
            </section>
          ) : !error ? (
            <div className="customer-empty-state">
              <i className="bi bi-calendar2-week" aria-hidden="true" />
              <strong>Chọn dịch vụ để tra cứu lịch trống</strong>
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <Container fluid className="py-4 px-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold text-uppercase mb-1" style={{ color: "#800020" }}>
            <i className="bi bi-calendar2-week me-2"></i>Tra cứu lịch trống (Slot Availability)
          </h2>
          <p className="text-muted mb-0">
            Kiểm tra các khung giờ còn trống theo dịch vụ, ngày hẹn và kỹ thuật viên.
          </p>
        </div>

        {role === "Guest" && (
          <Button
            variant="outline-danger"
            onClick={() => navigate("/bssms-guest")}
          >
            <i className="bi bi-house-door me-1"></i> Trang chủ
          </Button>
        )}
      </div>

      {/* Bộ lọc tra cứu */}
      <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "14px" }}>
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Group>
                <Form.Label className="fw-bold">Chọn dịch vụ *</Form.Label>
                <Form.Select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    setSelectedTechId("");
                  }}
                >
                  {services.map((s) => (
                    <option key={s.serviceId} value={s.serviceId}>
                      {s.serviceName} ({s.duration} phút -{" "}
                      {Number(s.price).toLocaleString("vi-VN")} ₫)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-bold">Ngày hẹn *</Form.Label>
                <Form.Control
                  type="date"
                  min={getTodayString()}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label className="fw-bold">Kỹ thuật viên (Tùy chọn)</Form.Label>
                <Form.Select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                >
                  <option value="">-- Tất cả kỹ thuật viên --</option>
                  {slotData?.technicians?.map((t) => (
                    <option key={t.staffId} value={t.staffId}>
                      {t.fullName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-2 text-muted">Đang tính toán các khung giờ trống...</p>
        </div>
      ) : slotData ? (
        <Card className="shadow-sm border-0" style={{ borderRadius: "14px" }}>
          <Card.Header className="d-flex flex-wrap justify-content-between align-items-center py-3">
            <div>
              <span className="fw-bold fs-5">{slotData.serviceName}</span>
              <Badge bg="primary" className="ms-2">
                Thời lượng: {slotData.duration} phút
              </Badge>
            </div>
            <div className="d-flex gap-3 small">
              <span>
                <Badge bg="success" className="me-1">&nbsp;</Badge> Còn chỗ trống
              </span>
              <span>
                <Badge bg="secondary" className="me-1">&nbsp;</Badge> Đã kín lịch
              </span>
            </div>
          </Card.Header>

          <Card.Body className="p-4">
            <Row className="g-3">
              {slotData.slots?.map((slot) => (
                <Col key={slot.startTime} xs={6} sm={4} md={3} lg={2}>
                  <Card
                    onClick={() => handleSelectSlot(slot)}
                    className={`h-100 text-center border ${
                      slot.available
                        ? "border-success shadow-sm"
                        : "bg-light text-muted opacity-75"
                    }`}
                    style={{
                      cursor: slot.available ? "pointer" : "not-allowed",
                      borderRadius: "12px",
                    }}
                  >
                    <Card.Body className="p-3">
                      <div className="fw-bold fs-5 mb-1">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      {slot.available ? (
                        <>
                          <Badge bg="success" className="mb-2">
                            Còn trống
                          </Badge>
                          <div className="small text-muted">
                            <i className="bi bi-person-check me-1"></i>
                            {slot.availableTechnicianCount} KTV rảnh
                          </div>
                          <div className="small text-primary fw-semibold mt-1">
                            {role === "Customer"
                              ? "Nhấn để đặt online →"
                              : role === "Receptionist" || role === "Manager"
                              ? "Tạo lịch tại quầy →"
                              : "Đăng nhập để đặt →"}
                          </div>
                        </>
                      ) : (
                        <Badge bg="secondary">Hết chỗ</Badge>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      ) : null}
    </Container>
  );
};

export default CheckSlotAvailability;