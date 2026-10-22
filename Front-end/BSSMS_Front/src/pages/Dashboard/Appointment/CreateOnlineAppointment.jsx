import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import servicePhoto from "../../../assets/figma/service-card-exact-02.png";

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

        if (!srvRes.ok) {
          throw new Error(`Không thể tải dịch vụ (${srvRes.status}).`);
        }

        const srvData = await srvRes.json();
        const activeSrvs = Array.isArray(srvData)
          ? srvData.filter((s) => s.status?.toLowerCase() === "active")
          : [];
        setServices(activeSrvs);
        if (activeSrvs.length > 0) {
          setServiceId((currentServiceId) =>
            currentServiceId || String(activeSrvs[0].serviceId)
          );
        }

        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          setMyPackages(Array.isArray(pkgData) ? pkgData : []);
        } else {
          setError(`Không thể tải gói liệu trình (${pkgRes.status}).`);
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu đặt lịch online:", err);
        setError("Không thể tải dữ liệu đặt lịch. Vui lòng thử lại.");
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
      setError("");
      try {
        const params = new URLSearchParams({
          serviceId,
          date: appointmentDate,
        });
        if (technicianId) params.append("technicianId", technicianId);

        const res = await fetch(`/api/booking/slots?${params.toString()}`, {
          credentials: "include",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setSlotInfo(null);
          setError(data.message || "Không thể tải khung giờ phù hợp.");
          return;
        }

        const data = await res.json();
        setSlotInfo(data);
      } catch (err) {
        console.error("Lỗi tải khung giờ:", err);
        setSlotInfo(null);
        setError("Lỗi kết nối máy chủ khi kiểm tra lịch trống.");
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [serviceId, appointmentDate, technicianId]);

  const selectedService = services.find(
    (s) => String(s.serviceId) === String(serviceId)
  );
  const selectedSlot = slotInfo?.slots?.find(
    (slot) => slot.startTime === startTime
  );
  const selectedTechnician = slotInfo?.technicians?.find(
    (technician) => String(technician.staffId) === String(technicianId)
  );
  const selectedPackage = myPackages.find(
    (pkg) => String(pkg.customerPackageId) === String(customerPackageId)
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
      console.error("Lỗi đặt lịch online:", err);
      setError("Lỗi kết nối máy chủ khi đặt lịch hẹn!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="customer-online-booking-page">
      <section className="customer-booking-banner">
        <div className="customer-booking-container">
          <div className="customer-breadcrumb">
            <button type="button" onClick={() => navigate("/customer/home")}>Trang chủ</button>
            <i className="bi bi-chevron-right" aria-hidden="true" />
            <strong>Đặt lịch hẹn online</strong>
          </div>
          <div className="customer-booking-banner-row">
            <div>
              <span className="home-eyebrow">DÀNH MỘT KHOẢNG THỜI GIAN CHO BẠN</span>
              <h1>Đặt lịch hẹn online</h1>
              <p>Chọn dịch vụ lẻ hoặc gói liệu trình của bạn và khung giờ yêu thích.<br />Kiểm tra thông tin và xác nhận để hoàn tất đặt lịch tại Seoul Center.</p>
            </div>
            <Button variant="light" onClick={() => navigate("/appointments")}>
              <i className="bi bi-list-ul" aria-hidden="true" /> Lịch hẹn của tôi
            </Button>
          </div>
        </div>
      </section>

      <div className="customer-booking-container customer-booking-body">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {bookingResult && (
          <Alert variant="success" className="customer-booking-success">
            <Alert.Heading>Đặt lịch hẹn thành công!</Alert.Heading>
            <p>
              Mã lịch hẹn: <strong>#{bookingResult.appointmentId}</strong>
              {" · "}Ngày hẹn: <strong>{bookingResult.appointmentDate}</strong>
              {" · "}Khung giờ: <strong>{bookingResult.startTime} - {bookingResult.endTime}</strong>
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button onClick={() => navigate(`/appointments/${bookingResult.appointmentId}`)}>
                Xem chi tiết lịch hẹn
              </Button>
              <Button variant="outline-success" onClick={() => navigate("/appointments")}>
                Danh sách lịch hẹn
              </Button>
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSubmit} className="customer-booking-form">
          <section className="customer-booking-service-panel">
            <div className="customer-booking-section-title">
              <span>01</span>
              <h2>Hình thức sử dụng dịch vụ</h2>
              <small>* Thông tin bắt buộc</small>
            </div>

            <div className="customer-booking-type-options">
              <div
                className={`customer-booking-type-option${bookingType === "single" ? " is-selected" : ""}`}
                onClick={() => {
                  setBookingType("single");
                  setCustomerPackageId("");
                }}
              >
                <Form.Check
                  type="radio"
                  name="bookingType"
                  id="type-single"
                  checked={bookingType === "single"}
                  onChange={() => {
                    setBookingType("single");
                    setCustomerPackageId("");
                  }}
                />
                <span>
                  <strong>Sử dụng dịch vụ lẻ (Tính theo lượt)</strong>
                </span>
                {bookingType === "single" && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
              </div>

              <div
                className={`customer-booking-type-option${bookingType === "package" ? " is-selected" : ""}${myPackages.length === 0 ? " is-disabled" : ""}`}
                onClick={() => {
                  if (myPackages.length > 0) setBookingType("package");
                }}
              >
                <Form.Check
                  type="radio"
                  name="bookingType"
                  id="type-package"
                  checked={bookingType === "package"}
                  onChange={() => setBookingType("package")}
                  disabled={myPackages.length === 0}
                />
                <span>
                  <strong>Sử dụng gói liệu trình đã mua</strong>
                  <small>
                    {myPackages.length > 0
                      ? `${myPackages.length} gói khả dụng`
                      : "Bạn chưa có gói có thể sử dụng"}
                  </small>
                </span>
                {bookingType === "package" && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
              </div>
            </div>

            {bookingType === "package" ? (
              <div className="customer-booking-fields customer-booking-fields-package">
                <Form.Group>
                  <Form.Label>Chọn gói liệu trình của bạn *</Form.Label>
                  <Form.Select
                    value={customerPackageId}
                    onChange={(event) => handleSelectPackage(event.target.value)}
                    required
                  >
                    <option value="">-- Chọn gói liệu trình --</option>
                    {myPackages.map((pkg) => (
                      <option key={pkg.customerPackageId} value={pkg.customerPackageId}>
                        {pkg.packageName} · {pkg.serviceName} · Còn {pkg.remainingSessions} buổi
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>
            ) : (
              <div className="customer-booking-fields">
                <Form.Group className="customer-booking-service-field">
                  <Form.Label>Dịch vụ làm đẹp *</Form.Label>
                  <Form.Select
                    value={serviceId}
                    onChange={(event) => {
                      setServiceId(event.target.value);
                      setStartTime("");
                    }}
                    required
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map((service) => (
                      <option key={service.serviceId} value={service.serviceId}>
                        {service.serviceName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Thời lượng</Form.Label>
                  <Form.Control readOnly value={selectedService ? `${selectedService.duration} phút` : ""} />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Chi phí dự kiến</Form.Label>
                  <Form.Control
                    readOnly
                    value={selectedService ? `${Number(selectedService.price).toLocaleString("vi-VN")} đ` : ""}
                  />
                </Form.Group>
              </div>
            )}

            <div className="customer-booking-divider" />
            <div className="customer-booking-section-title customer-booking-section-title-small">
              <span>02</span>
              <h2>Chọn Ngày &amp; Kỹ thuật viên</h2>
            </div>
            <div className="customer-booking-fields customer-booking-date-fields">
              <Form.Group>
                <Form.Label>Ngày hẹn *</Form.Label>
                <Form.Control
                  type="date"
                  min={getTodayString()}
                  value={appointmentDate}
                  onChange={(event) => {
                    setAppointmentDate(event.target.value);
                    setStartTime("");
                  }}
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Kỹ thuật viên yêu thích (Tùy chọn)</Form.Label>
                <Form.Select
                  value={technicianId}
                  onChange={(event) => {
                    setTechnicianId(event.target.value);
                    setStartTime("");
                  }}
                >
                  <option value="">Tự động chọn KTV tốt nhất</option>
                  {slotInfo?.technicians?.map((technician) => (
                    <option key={technician.staffId} value={technician.staffId}>
                      {technician.fullName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </section>

          <div className="customer-booking-columns">
            <div className="customer-booking-main-column">
              <section className="customer-booking-slot-panel">
                <div className="customer-booking-section-title">
                  <span>03</span>
                  <h2>Chọn khung giờ trống *</h2>
                  {slotInfo?.slots && <small>{slotInfo.slots.length} khung giờ</small>}
                </div>
                <div className="customer-booking-slot-meta">
                  <span><i className="bi bi-calendar3" aria-hidden="true" /> {appointmentDate}</span>
                  <span><i className="bi bi-person" aria-hidden="true" /> KTV khả dụng</span>
                  <span><i className="bi bi-circle-fill" aria-hidden="true" /> Còn trống</span>
                  <span><i className="bi bi-check-circle-fill" aria-hidden="true" /> Đã chọn</span>
                </div>

                {loadingSlots ? (
                  <div className="customer-booking-slots-message" role="status">
                    <Spinner animation="border" size="sm" variant="danger" />
                    <span>Đang kiểm tra lịch trống...</span>
                  </div>
                ) : slotInfo?.slots?.length ? (
                  <div className="customer-booking-slot-grid">
                    {slotInfo.slots.map((slot) => {
                      const isSelected = startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          className={`customer-booking-slot${isSelected ? " is-selected" : ""}${slot.available ? "" : " is-unavailable"}`}
                          disabled={!slot.available}
                          onClick={() => setStartTime(slot.startTime)}
                          aria-pressed={isSelected}
                        >
                          <strong>{slot.startTime} - {slot.endTime}</strong>
                          <span><i className="bi bi-person" aria-hidden="true" /> Còn {slot.availableTechnicianCount} KTV</span>
                          <small>{isSelected ? "Đã chọn" : slot.available ? "Còn trống" : "Đã kín"}</small>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="customer-booking-slots-message">
                    <i className="bi bi-calendar-x" aria-hidden="true" />
                    <span>{serviceId ? "Không có khung giờ phù hợp cho lựa chọn này." : "Vui lòng chọn dịch vụ để xem khung giờ."}</span>
                  </div>
                )}

                <p className="customer-booking-slot-footnote">
                  Hiển thị {slotInfo?.slots?.length || 0} khung giờ · Chọn một khung giờ phù hợp với bạn.
                </p>
              </section>

              <section className="customer-booking-notes-panel">
                <div className="customer-booking-section-title">
                  <span>04</span>
                  <h2>Ghi chú tình trạng da / Yêu cầu thêm</h2>
                  <small>Tùy chọn</small>
                </div>
                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={500}
                  placeholder="Nhập lưu ý về làn da, dị ứng mỹ phẩm hoặc yêu cầu đặc biệt..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </section>
            </div>

            <aside className="customer-booking-summary">
              <div className="customer-booking-summary-card">
                <h2><i className="bi bi-receipt" aria-hidden="true" /> Thông tin đặt hẹn</h2>
                <div className="customer-booking-summary-service">
                  <img src={servicePhoto} alt="Dịch vụ chăm sóc da Seoul Center" />
                  <div>
                    <small>{bookingType === "package" ? "DỊCH VỤ GÓI LIỆU TRÌNH" : "DỊCH VỤ LẺ · TÍNH THEO LƯỢT"}</small>
                    <strong>{selectedService?.serviceName || selectedPackage?.serviceName || "Chưa chọn dịch vụ"}</strong>
                  </div>
                </div>
                <div className="customer-booking-summary-slot">
                  <small><i className="bi bi-check-circle" aria-hidden="true" /> Khung giờ đã chọn</small>
                  <strong>{selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : "Chưa chọn khung giờ"}</strong>
                  <span>{new Date(`${appointmentDate}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                </div>
                <dl className="customer-booking-summary-details">
                  <div><dt><i className="bi bi-clock" aria-hidden="true" /> Thời lượng</dt><dd>{selectedService?.duration ? `${selectedService.duration} phút` : "—"}</dd></div>
                  <div><dt><i className="bi bi-person" aria-hidden="true" /> Kỹ thuật viên</dt><dd>{selectedTechnician?.fullName || "Tự động chọn"}</dd></div>
                  {bookingType === "package" && <div><dt><i className="bi bi-box-seam" aria-hidden="true" /> Gói liệu trình</dt><dd>{selectedPackage?.packageName || "Chưa chọn gói"}</dd></div>}
                </dl>
                <div className="customer-booking-summary-total">
                  <span>Chi phí dự kiến</span>
                  <strong>{selectedService ? `${Number(selectedService.price).toLocaleString("vi-VN")} đ` : "—"}</strong>
                </div>
                <Button
                  type="submit"
                  className="customer-booking-confirm"
                  disabled={submitting || !startTime || !selectedSlot?.available}
                >
                  {submitting ? <><Spinner size="sm" /> Đang xử lý...</> : <><i className="bi bi-check-lg" aria-hidden="true" /> Xác nhận Đặt lịch Online</>}
                </Button>
                <small className="customer-booking-summary-caption">
                  Thông tin đã sẵn sàng. Nhấn xác nhận để hoàn tất đặt lịch chăm sóc.
                </small>
              </div>
              <div className="customer-booking-reminder">
                <strong><i className="bi bi-info-circle" aria-hidden="true" /> Trước khi xác nhận</strong>
                <p>Kiểm tra dịch vụ, ngày và khung giờ đã chọn. Bạn có thể thay đổi lựa chọn trước khi gửi yêu cầu đặt lịch.</p>
              </div>
            </aside>
          </div>

          <div className="customer-booking-bottom-actions">
            <span>{startTime ? `Đã chọn: ${startTime} · ${appointmentDate}` : "Chưa chọn khung giờ"}</span>
            <Button variant="outline-secondary" onClick={() => navigate("/slots")} disabled={submitting}>
              <i className="bi bi-calendar3" aria-hidden="true" /> Xem bảng lịch trống
            </Button>
          </div>
        </Form>
      </div>
    </main>
  );
};

export default CreateOnlineAppointment;