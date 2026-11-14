import { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { api, money } from "../services/api";

export const MAX_SERVICES = 4;
export const emptyLine = () => ({ serviceId: "", customerPackageId: "" });

export const toServiceLines = (lines) =>
  lines
    .filter((l) => l.serviceId)
    .map((l) => ({
      serviceId: Number(l.serviceId),
      customerPackageId: l.customerPackageId ? Number(l.customerPackageId) : null,
    }));

export function packagesFor(packages, lines, index) {
  const serviceId = Number(lines[index]?.serviceId);
  if (!serviceId) return [];
  return packages.filter((p) => {
    if (!(p.services || []).some((s) => Number(s.serviceId) === serviceId)) return false;
    const usedElsewhere = lines.filter(
      (l, i) => i !== index && String(l.customerPackageId) === String(p.customerPackageId),
    ).length;
    return Number(p.availableSessions ?? p.remainingSessions) - usedElsewhere > 0;
  });
}

export function estimateTotal(lines, services) {
  return lines.reduce((sum, l) => {
    if (!l.serviceId || l.customerPackageId) return sum;
    const s = services.find((x) => String(x.serviceId) === String(l.serviceId));
    return sum + Number(s?.price || 0);
  }, 0);
}

export function ServiceLinesEditor({ services, packages = [], lines, onChange, disabled }) {
  const update = (index, patch) =>
    onChange(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const remove = (index) => onChange(lines.length === 1 ? [emptyLine()] : lines.filter((_, i) => i !== index));
  return (
    <div className="booking-service-lines">
      {lines.map((line, index) => {
        const service = services.find((s) => String(s.serviceId) === String(line.serviceId));
        const usable = packagesFor(packages, lines, index);
        return (
          <div className="customer-booking-fields booking-service-line" key={index}>
            <Form.Group className="customer-booking-service-field">
              <Form.Label>Dịch vụ thứ {index + 1}{index === 0 ? " *" : ""}</Form.Label>
              <Form.Select
                value={line.serviceId}
                disabled={disabled}
                onChange={(e) => update(index, { serviceId: e.target.value, customerPackageId: "" })}
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map((s) => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.serviceName} · {s.duration} phút
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Thanh toán dòng này</Form.Label>
              <Form.Select
                value={line.customerPackageId}
                disabled={disabled || !line.serviceId || usable.length === 0}
                onChange={(e) => update(index, { customerPackageId: e.target.value })}
              >
                <option value="">{service ? `Trả theo lượt · ${money(service.price)}` : "Trả theo lượt"}</option>
                {usable.map((p) => (
                  <option key={p.customerPackageId} value={p.customerPackageId}>
                    Dùng gói {p.packageName} · còn {p.availableSessions ?? p.remainingSessions} buổi
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="booking-service-line-actions">
              <Button
                variant="link"
                className="manager-list-action manager-list-action--delete"
                disabled={disabled || (lines.length === 1 && !line.serviceId)}
                onClick={() => remove(index)}
              >
                <i className="bi bi-x-circle" aria-hidden="true" /> Bỏ
              </Button>
            </div>
          </div>
        );
      })}
      {lines.length < MAX_SERVICES && (
        <Button
          variant="outline-secondary"
          size="sm"
          disabled={disabled || !lines[lines.length - 1]?.serviceId}
          onClick={() => onChange([...lines, emptyLine()])}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" /> Thêm dịch vụ (tối đa {MAX_SERVICES})
        </Button>
      )}
      <Form.Text className="d-block mt-2">
        Các dịch vụ được làm liên tiếp theo thứ tự đã chọn. Lịch 3–4 dịch vụ được chia cho 2 kỹ thuật viên.
      </Form.Text>
    </div>
  );
}

export function useSlots(lines, date, technicianId, appointmentId) {
  const ids = lines.filter((l) => l.serviceId).map((l) => l.serviceId).join(",");
  const [state, setState] = useState({ data: null, loading: false, error: "" });
  useEffect(() => {
    if (!ids || !date) {
      setState({ data: null, loading: false, error: "" });
      return undefined;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ serviceIds: ids, date });
    if (technicianId) params.set("technicianId", technicianId);
    if (appointmentId) params.set("appointmentId", appointmentId);
    setState((s) => ({ ...s, loading: true, error: "" }));
    api(`/api/booking/slots?${params}`, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((e) => {
        if (!controller.signal.aborted) setState({ data: null, loading: false, error: e.message });
      });
    return () => controller.abort();
  }, [ids, date, technicianId, appointmentId]);
  return state;
}

export function SlotGrid({ slots, loading, error, value, onSelect, emptyText }) {
  if (loading)
    return (
      <div className="customer-booking-slots-message" role="status">
        <Spinner animation="border" size="sm" variant="danger" />
        <span>Đang kiểm tra lịch trống...</span>
      </div>
    );
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!slots?.length)
    return (
      <div className="customer-booking-slots-message">
        <i className="bi bi-calendar-x" aria-hidden="true" />
        <span>{emptyText || "Vui lòng chọn dịch vụ để xem khung giờ."}</span>
      </div>
    );
  return (
    <div className="customer-booking-slot-grid">
      {slots.map((slot) => {
        const selected = value === slot.startTime;
        return (
          <button
            key={slot.startTime}
            type="button"
            className={`customer-booking-slot${selected ? " is-selected" : ""}${slot.available ? "" : " is-unavailable"}`}
            disabled={!slot.available || !onSelect}
            onClick={() => onSelect?.(slot.startTime)}
            aria-pressed={selected}
          >
            <strong>
              {slot.startTime} - {slot.endTime}
            </strong>
            <span>
              <i className="bi bi-person" aria-hidden="true" />{" "}
              {slot.available ? `Còn ${slot.availableTechnicianCount} KTV` : "Không khả dụng"}
            </span>
            <small>{selected ? "Đã chọn" : slot.available ? "Còn trống" : slot.reason}</small>
          </button>
        );
      })}
    </div>
  );
}

export function PlanPreview({ services, startTime }) {
  if (!services?.length) return null;
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const shift = startTime ? toMin(startTime) - toMin(services[0].startTime) : 0;
  return (
    <ul className="booking-plan-preview">
      {services.map((s) => (
        <li key={s.lineNo}>
          <strong>{s.serviceName}</strong>
          <span>
            {fmt(toMin(s.startTime) + shift)} – {fmt(toMin(s.endTime) + shift)} · {s.duration} phút · KTV phần {s.part}
          </span>
        </li>
      ))}
    </ul>
  );
}
