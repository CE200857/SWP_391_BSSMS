// UC Request Leave — staff view their weekly shifts and submit leave requests.
import { useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { api, post, today, addDays, viDate, time5, label } from "../../../services/api";
import FloatingAlert from "../../../components/FloatingAlert";
import { WEEKDAYS, mondayOf, shiftShort, useOperations } from "./operationsShared";

export default function MyWorkSchedule() {
  const [week, setWeek] = useState(mondayOf(today()));
  const { data, error, loading, load, setError } = useOperations("my-schedule", week);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ startDate: "", endDate: "", reason: "" });
  // Ngày nghỉ sớm nhất do back-end tính: thứ 2 ngay sau thứ 6 gần nhất (thứ 6 + 3 ngày)
  const earliest = data?.leaveRule?.earliestStartDate || addDays(today(), 1);
  const startDate = form.startDate || earliest;
  const endDate = form.endDate && form.endDate >= startDate ? form.endDate : startDate;
  const [busy, setBusy] = useState(false);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));

  const send = async (body) => {
    setBusy(true);
    try {
      const r = await post("/api/operations/leaves", body);
      setNotice(r.message);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const leaves = data?.leaves || [];
  const onLeave = (d) => leaves.some((l) => l.status === "Approved" && String(l.startDate).slice(0, 10) <= d && String(l.endDate).slice(0, 10) >= d);
  const shiftOf = (d) => (data?.shifts || []).find((s) => String(s.shiftDate).slice(0, 10) === d);
  const workDays = days.filter((d) => shiftOf(d) && !onLeave(d)).length;
  const dayCount = (a, b) => Math.round((new Date(`${String(b).slice(0, 10)}T00:00:00Z`) - new Date(`${String(a).slice(0, 10)}T00:00:00Z`)) / 86400000) + 1;
  const isThisWeek = week === mondayOf(today());

  return (
    <div className="ms-page">
      <FloatingAlert message={error} onClose={() => setError("")} />
      <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

      <section className="ms-card">
        <div className="ms-week-bar">
          <div className="ms-week-nav">
            <button type="button" className="ms-icon-btn" aria-label="Previous week" onClick={() => setWeek(addDays(week, -7))}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
            <strong>{viDate(week).slice(0, 5)} – {viDate(addDays(week, 6))}</strong>
            <button type="button" className="ms-icon-btn" aria-label="Next week" onClick={() => setWeek(addDays(week, 7))}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
            {!isThisWeek && <button type="button" className="ms-pill-btn" onClick={() => setWeek(mondayOf(today()))}>This week</button>}
          </div>
          <span className="ms-week-sum">
            {loading ? <Spinner size="sm" animation="border" /> : <><strong>{workDays}</strong> working day{workDays === 1 ? "" : "s"} · {7 - workDays} off</>}
          </span>
        </div>

        <div className="ms-days">
          {days.map((d, i) => {
            const shift = shiftOf(d);
            const leave = onLeave(d);
            const state = leave ? "leave" : shift ? shift.shiftType : "off";
            return (
              <div key={d} className={`ms-day ms-day--${state}${d === today() ? " is-today" : ""}`}>
                <div className="ms-day-head">
                  <span>{WEEKDAYS[i].slice(0, 3)}</span>
                  <strong>{viDate(d).slice(0, 5)}</strong>
                  {d === today() && <em>Today</em>}
                </div>
                <div className="ms-day-body">
                  <b>{leave ? "On leave" : shift ? shiftShort[shift.shiftType] : "Day off"}</b>
                  {shift && !leave && <small>{time5(shift.startTime)}–{time5(shift.endTime)}</small>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="ms-grid">
        <section className="ms-card">
          <header className="ms-card-head"><h4>Request leave</h4></header>
          <div className="ms-dates">
            <Form.Group controlId="leave-from">
              <Form.Label>From</Form.Label>
              <Form.Control type="date" min={earliest} value={startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Form.Group>
            <Form.Group controlId="leave-to">
              <Form.Label>To</Form.Label>
              <Form.Control type="date" min={startDate} value={endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Form.Group>
          </div>
          <p className="ms-rule">
            <i className="bi bi-info-circle" aria-hidden="true" />
            <span>Leave can start from <strong>{viDate(earliest)}</strong>. Requests are reviewed on Fridays, and only one person can be off per day.</span>
          </p>
          <Form.Group controlId="leave-reason">
            <Form.Label>Reason *</Form.Label>
            <Form.Control as="textarea" rows={3} maxLength={500} placeholder="e.g. Family event" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            <Form.Text className="d-flex justify-content-between">
              <span>At least 5 characters.</span>
              <span>{form.reason.length}/500</span>
            </Form.Text>
          </Form.Group>
          <Button className="ms-submit" disabled={busy || form.reason.trim().length < 5} onClick={() => send({ action: "request", startDate, endDate, reason: form.reason.trim() || null })}>
            <i className="bi bi-send" aria-hidden="true" /> {busy ? "Sending…" : `Send request · ${dayCount(startDate, endDate)} day${dayCount(startDate, endDate) === 1 ? "" : "s"}`}
          </Button>
        </section>

        <section className="ms-card">
          <header className="ms-card-head"><h4>My leave requests</h4><span>{leaves.length}</span></header>
          {leaves.length ? (
            <ul className="ms-leaves">
              {leaves.map((l) => (
                <li key={l.leaveId}>
                  <div className="ms-leave-date">
                    <strong>{viDate(l.startDate)}{String(l.endDate).slice(0, 10) !== String(l.startDate).slice(0, 10) ? ` – ${viDate(l.endDate)}` : ""}</strong>
                    <small>{dayCount(l.startDate, l.endDate)} day{dayCount(l.startDate, l.endDate) === 1 ? "" : "s"}</small>
                  </div>
                  <div className="ms-leave-reason">
                    {l.reason || "—"}
                    {l.decisionNote && <small>Manager: {l.decisionNote}</small>}
                  </div>
                  <div className="ms-leave-side">
                    <span className={`ms-status ms-status--${l.status}`}>{label(l.status)}</span>
                    {l.status === "Pending" && (
                      <button type="button" className="ms-cancel" disabled={busy} onClick={() => send({ action: "cancel", id: l.leaveId })}>Cancel</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ms-empty"><i className="bi bi-calendar2-heart" aria-hidden="true" /><p>No leave requests yet.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}
