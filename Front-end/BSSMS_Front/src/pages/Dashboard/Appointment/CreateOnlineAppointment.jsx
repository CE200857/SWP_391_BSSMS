import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import BookingPaymentNotice from "../../../components/BookingPaymentNotice";
import {
  ServiceLinesEditor, SlotGrid, PlanPreview, useSlots, emptyLine, toServiceLines, estimateTotal,
} from "../../../components/BookingPicker";
import { api, post, money, today, addDays, viDate } from "../../../services/api";
import servicePhoto from "../../../assets/figma/service-card-exact-02.png";

const CreateOnlineAppointment = () => {
  const navigate = useNavigate();
  const prefill = useLocation().state || {};
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [lines, setLines] = useState(() =>
    prefill.serviceIds?.length
      ? prefill.serviceIds.map((id) => ({ serviceId: String(id), customerPackageId: "" }))
      : prefill.serviceId
        ? [{ serviceId: String(prefill.serviceId), customerPackageId: "" }]
        : [emptyLine()],
  );
  const [appointmentDate, setAppointmentDate] = useState(() => {
    if (prefill.appointmentDate) return prefill.appointmentDate;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= 16 * 60 ? addDays(today(), 1) : today();
  });
  const [technicianId, setTechnicianId] = useState("");
  const [startTime, setStartTime] = useState(prefill.startTime || "");
  const [notes, setNotes] = useState("");
  const [paymentChoice, setPaymentChoice] = useState("Counter");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [packageId, setPackageId] = useState(prefill.customerPackageId ? String(prefill.customerPackageId) : "");
  const bookedPackage = packages.find((p) => String(p.customerPackageId) === packageId);

  useEffect(() => {
    api("/api/service")
      .then((rows) => setServices((rows || []).filter((s) => s.status === "Active")))
      .catch((e) => setError(e.message));
    api("/api/booking/my-packages")
      .then((rows) => {
        const list = rows || [];
        setPackages(list);
        if (!prefill.customerPackageId) return;
        const pkg = list.find((p) => String(p.customerPackageId) === String(prefill.customerPackageId));
        if (!pkg || !pkg.services?.length || Number(pkg.availableSessions) <= 0) {
          setPackageId("");
          setError("Gói liệu trình đã hết buổi, hết hạn hoặc không còn dịch vụ áp dụng. Vui lòng chọn dịch vụ khác.");
          return;
        }
        setLines([{ serviceId: String(pkg.services[0].serviceId), customerPackageId: String(pkg.customerPackageId) }]);
      })
      .catch(() => setPackages([]));
  }, [prefill.customerPackageId]);

  const leavePackageMode = (keep) => {
    setPackageId("");
    setLines((current) => (keep ? [...current, emptyLine()] : [emptyLine()]));
    setStartTime("");
  };

  const slots = useSlots(lines, appointmentDate, technicianId);
  const selectedSlot = slots.data?.slots?.find((s) => s.startTime === startTime);
  const chosen = toServiceLines(lines);
  const total = useMemo(() => estimateTotal(lines, services), [lines, services]);
  const allPackage = chosen.length > 0 && chosen.every((l) => l.customerPackageId);

  const changeLines = (next) => { setLines(next); setStartTime(""); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!chosen.length) return setError("Vui lòng chọn ít nhất một dịch vụ.");
    if (!startTime) return setError("Vui lòng chọn khung giờ còn trống.");
    setSubmitting(true);
    try {
      const data = await post("/api/booking/online", {
        services: chosen,
        appointmentDate,
        startTime,
        technicianId: technicianId ? Number(technicianId) : null,
        paymentChoice: allPackage ? "Counter" : paymentChoice,
        notes: notes.trim() || null,
      });
      setResult({ ...data, appointmentDate, startTime, endTime: selectedSlot?.endTime });
      if (!allPackage && paymentChoice === "Online" && data.invoiceId) {
        const pay = await post("/api/payments/vnpay/create", { invoiceId: data.invoiceId });
        if (pay?.paymentUrl) window.location.assign(pay.paymentUrl);
      }
    } catch (e) {
      setError(e.message);
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
              <p>
                Chọn tối đa 4 dịch vụ làm liên tiếp, dùng buổi trong gói đã mua nếu có.
                <br />
                Đặt trước ít nhất 2 tiếng và tối đa 30 ngày; lễ tân sẽ xác nhận lịch của bạn.
              </p>
            </div>
            <Button variant="light" onClick={() => navigate("/appointments")}>
              <i className="bi bi-list-ul" aria-hidden="true" /> Lịch hẹn của tôi
            </Button>
          </div>
        </div>
      </section>

      <div className="customer-booking-container customer-booking-body">
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}
        {result && (
          <Alert variant="success" className="customer-booking-success">
            <Alert.Heading>Đặt lịch hẹn thành công!</Alert.Heading>
            <p>
              Mã lịch hẹn: <strong>#{result.appointmentId}</strong> · Ngày hẹn: <strong>{viDate(result.appointmentDate)}</strong>
              {" · "}Khung giờ: <strong>{result.startTime}{result.endTime ? ` - ${result.endTime}` : ""}</strong>
            </p>
            <p className="mb-2">{result.message}</p>
            <div className="d-flex flex-wrap gap-2">
              <Button onClick={() => navigate(`/appointments/${result.appointmentId}`)}>Xem chi tiết lịch hẹn</Button>
              <Button variant="outline-success" onClick={() => navigate("/appointments")}>Danh sách lịch hẹn</Button>
            </div>
          </Alert>
        )}

        <BookingPaymentNotice packageBooking={allPackage} />
        <Form noValidate onSubmit={handleSubmit} className="customer-booking-form">
          <section className="customer-booking-service-panel">
            <div className="customer-booking-section-title">
              <span>01</span>
              <h2>{packageId ? "Dịch vụ trong gói" : "Chọn dịch vụ"}</h2>
              <small>{packageId ? "Đã gắn sẵn từ gói liệu trình" : packages.length ? `${packages.length} gói còn buổi` : "* Thông tin bắt buộc"}</small>
            </div>
            {packageId && bookedPackage ? (
              <div className="booking-package-locked">
                <div className="booking-package-locked-head">
                  <span><i className="bi bi-box-seam" aria-hidden="true" /> Đặt lịch dùng gói</span>
                  <strong>{bookedPackage.packageName}</strong>
                  <small>Còn {bookedPackage.availableSessions} buổi có thể đặt · Hạn dùng {viDate(bookedPackage.expiryDate)} · Buổi này không tính tiền</small>
                </div>
                {bookedPackage.services.length > 1 ? (
                  <Form.Group className="mt-3">
                    <Form.Label>Dịch vụ trong gói</Form.Label>
                    <Form.Select
                      value={lines[0]?.serviceId || ""}
                      disabled={submitting || !!result}
                      onChange={(e) => changeLines([{ serviceId: e.target.value, customerPackageId: packageId }])}
                    >
                      {bookedPackage.services.map((s) => (
                        <option key={s.serviceId} value={s.serviceId}>{s.serviceName} · {s.duration} phút</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                ) : (
                  <p className="mt-3 mb-0">
                    Dịch vụ: <strong>{bookedPackage.services[0].serviceName}</strong> · {bookedPackage.services[0].duration} phút
                  </p>
                )}
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Button variant="outline-secondary" size="sm" disabled={submitting || !!result} onClick={() => leavePackageMode(true)}>
                    <i className="bi bi-plus-lg" aria-hidden="true" /> Thêm dịch vụ khác vào lịch này
                  </Button>
                  <Button variant="link" size="sm" className="p-0" disabled={submitting || !!result} onClick={() => leavePackageMode(false)}>
                    Không dùng gói, chọn dịch vụ khác
                  </Button>
                </div>
              </div>
            ) : packageId ? (
              <div className="customer-booking-slots-message"><Spinner size="sm" /> Đang tải gói liệu trình...</div>
            ) : (
              <ServiceLinesEditor services={services} packages={packages} lines={lines} onChange={changeLines} disabled={submitting || !!result} />
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
                  min={today()}
                  max={addDays(today(), 30)}
                  value={appointmentDate}
                  onChange={(e) => { setAppointmentDate(e.target.value); setStartTime(""); }}
                  required
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Kỹ thuật viên yêu thích (Tùy chọn)</Form.Label>
                <Form.Select value={technicianId} onChange={(e) => { setTechnicianId(e.target.value); setStartTime(""); }}>
                  <option value="">Tự động chọn theo lượt tour</option>
                  {slots.data?.technicians?.map((t) => (
                    <option key={t.staffId} value={t.staffId}>{t.fullName}</option>
                  ))}
                </Form.Select>
                <Form.Text>Kỹ thuật viên được yêu cầu sẽ làm phần dịch vụ đầu tiên.</Form.Text>
              </Form.Group>
            </div>
          </section>

          <div className="customer-booking-columns">
            <div className="customer-booking-main-column">
              <section className="customer-booking-slot-panel">
                <div className="customer-booking-section-title">
                  <span>03</span>
                  <h2>Chọn khung giờ trống *</h2>
                  {slots.data?.slots && <small>{slots.data.slots.filter((s) => s.available).length} khung còn trống</small>}
                </div>
                <div className="customer-booking-slot-meta">
                  <span><i className="bi bi-calendar3" aria-hidden="true" /> {viDate(appointmentDate)}</span>
                  <span><i className="bi bi-hourglass-split" aria-hidden="true" /> Tổng {slots.data?.totalDuration || 0} phút</span>
                  <span><i className="bi bi-circle-fill" aria-hidden="true" /> Còn trống</span>
                  <span><i className="bi bi-check-circle-fill" aria-hidden="true" /> Đã chọn</span>
                </div>
                <SlotGrid
                  slots={slots.data?.slots}
                  loading={slots.loading}
                  error={slots.error}
                  value={startTime}
                  onSelect={setStartTime}
                />
                <p className="customer-booking-slot-footnote">
                  Giờ mở cửa 08:30–18:30. Khung giờ chỉ trống khi đủ kỹ thuật viên phù hợp và giường đúng loại phòng.
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
                  maxLength={1000}
                  placeholder="Nhập lưu ý về làn da, dị ứng mỹ phẩm hoặc yêu cầu đặc biệt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </section>
            </div>

            <aside className="customer-booking-summary">
              <div className="customer-booking-summary-card">
                <h2><i className="bi bi-receipt" aria-hidden="true" /> Thông tin đặt hẹn</h2>
                <div className="customer-booking-summary-service">
                  <img src={servicePhoto} alt="Dịch vụ chăm sóc da Seoul Center" loading="lazy" decoding="async"
                    onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                    onError={(e) => e.currentTarget.classList.add("is-loaded")} />
                  <div>
                    <small>{chosen.length ? `${chosen.length} DỊCH VỤ LIÊN TIẾP` : "CHƯA CHỌN DỊCH VỤ"}</small>
                    <strong>{slots.data?.services?.map((s) => s.serviceName).join(" → ") || "Chưa chọn dịch vụ"}</strong>
                  </div>
                </div>
                <div className="customer-booking-summary-slot">
                  <small><i className="bi bi-check-circle" aria-hidden="true" /> Khung giờ đã chọn</small>
                  <strong>{selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : "Chưa chọn khung giờ"}</strong>
                  <span>
                    {new Date(`${appointmentDate}T00:00:00`).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
                <PlanPreview services={slots.data?.services} startTime={startTime} />
                <div className="customer-booking-summary-total">
                  <span>Chi phí dự kiến (trước ưu đãi hạng)</span>
                  <strong>{chosen.length ? money(total) : "—"}</strong>
                </div>
                {!allPackage && (
                  <Form.Group className="customer-booking-payment">
                    <Form.Label>Hình thức thanh toán</Form.Label>
                    <Form.Check type="radio" id="pay-counter" name="paymentChoice" className="customer-booking-payment-option"
                      label="Thanh toán tại quầy" checked={paymentChoice === "Counter"}
                      onChange={() => setPaymentChoice("Counter")} disabled={submitting || !!result} />
                    <Form.Check type="radio" id="pay-online" name="paymentChoice" className="customer-booking-payment-option"
                      label="Thanh toán trước qua VNPay" checked={paymentChoice === "Online"}
                      onChange={() => setPaymentChoice("Online")} disabled={submitting || !!result} />
                    <Form.Text className="customer-booking-payment-help">
                      {paymentChoice === "Online"
                        ? "Liên kết VNPay có hiệu lực 15 phút. Nếu thanh toán không thành công, lịch tự chuyển sang thanh toán tại quầy."
                        : "Ưu đãi hạng thành viên và voucher được áp dụng khi thanh toán tại quầy."}
                    </Form.Text>
                  </Form.Group>
                )}
                <Button type="submit" className="customer-booking-confirm" disabled={submitting || slots.loading || !!result}>
                  {submitting ? <><Spinner size="sm" /> Đang xử lý...</> : <><i className="bi bi-check-lg" aria-hidden="true" /> Xác nhận Đặt lịch Online</>}
                </Button>
                <small className="customer-booking-summary-caption">
                  {!startTime ? "Chọn khung giờ còn trống trước khi xác nhận." : "Lịch ở trạng thái Chờ xác nhận cho đến khi lễ tân duyệt."}
                </small>
              </div>
              <div className="customer-booking-reminder">
                <strong><i className="bi bi-info-circle" aria-hidden="true" /> Chính sách hủy/đổi lịch</strong>
                <p>Bạn có thể đổi hoặc hủy lịch trước giờ hẹn ít nhất 2 tiếng. Đến trễ quá 15 phút lịch có thể bị đánh dấu không đến.</p>
              </div>
            </aside>
          </div>

          <div className="customer-booking-bottom-actions">
            <span>{startTime ? `Đã chọn: ${startTime} · ${viDate(appointmentDate)}` : "Chưa chọn khung giờ"}</span>
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
