import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, today } from "../../services/api";
import { appointmentStatusLabel } from "../../utils/appointmentStatus";
import { setAppointmentStatus } from "../../utils/appointmentActions";

export default function StaffOverview({ role }) {
  const technician = role === "Technician";
  const [data, setData] = useState({ items: [], loading: true, error: "" });
  const [revision, setRevision] = useState(0);
  const [approvingId, setApprovingId] = useState(null);
  const approve = async (appointmentId) => {
    setApprovingId(appointmentId);
    try {
      await setAppointmentStatus(appointmentId, "Confirmed");
      setRevision((value) => value + 1);
    } catch (error) {
      alert(error.message);
    } finally {
      setApprovingId(null);
    }
  };
  useEffect(() => {
    let active = true;
    api("/api/appointments")
      .then((items) => {
        if (!Array.isArray(items))
          throw new Error("Invalid appointment data.");
        if (active) setData({ items, loading: false, error: "" });
      })
      .catch((error) => {
        if (active)
          setData({ items: [], loading: false, error: error.message });
      });
    return () => {
      active = false;
    };
  }, [revision]);
  const day = today();
  const rows = data.items
    .filter((item) => String(item.appointmentDate).slice(0, 10) === day)
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  const upcomingPending = technician
    ? []
    : data.items
        .filter(
          (item) =>
            item.status === "Pending" &&
            String(item.appointmentDate).slice(0, 10) > day,
        )
        .sort(
          (a, b) =>
            String(a.appointmentDate).localeCompare(String(b.appointmentDate)) ||
            String(a.startTime).localeCompare(String(b.startTime)),
        );
  const metrics = [
    [
      "calendar2-week",
      technician ? "Appointments assigned today" : "Today’s appointments",
      rows.length,
    ],
    [
      technician ? "hourglass-split" : "clock",
      technician ? "Ready" : "Pending today",
      rows.filter((a) => a.status === (technician ? "Checked-in" : "Pending"))
        .length,
    ],
    [
      "activity",
      "In progress",
      rows.filter((a) => a.status === "In-progress").length,
    ],
    [
      "check2-circle",
      "Completed",
      rows.filter((a) => a.status === "Completed").length,
    ],
  ];
  return (
    <section className="staff-overview">
      <div className="ui-page-heading">
        <div>
          <h1>{technician ? "Today’s work" : "Receptionist overview"}</h1>
          <p>
            {technician
              ? "Track your assigned appointments and continue treatment sessions."
              : "Receive customers, arrange appointments and track activity at the counter."}
          </p>
        </div>
        <div className="d-flex gap-2">
        <Link className="btn btn-primary" to={technician ? "/treatment-status" : "/receptionist/coordination"}>
          <i className={`bi ${technician ? "bi-play-circle" : "bi-door-open"}`} aria-hidden="true" />{" "}
          {technician ? "Service status" : "Check-in & coordination"}
        </Link>
        <button
          className="btn btn-outline-primary"
          disabled={data.loading}
          onClick={() => {
            setData((current) => ({ ...current, loading: true, error: "" }));
            setRevision((value) => value + 1);
          }}
        >
          <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Refresh
        </button>
        </div>
      </div>
      {data.error && (
        <div className="alert alert-danger" role="alert">
          {data.error} Click Refresh to try again.
        </div>
      )}
      <div
        className="staff-metrics"
        aria-label="Today’s statistics"
        aria-busy={data.loading}
      >
        {metrics.map(([icon, label, value]) => (
          <article className="staff-metric" key={label}>
            <i className={`bi bi-${icon}`} aria-hidden="true" />
            <span>{label}</span>
            <strong>{data.loading || data.error ? "—" : value}</strong>
          </article>
        ))}
      </div>
      <section className="staff-schedule card">
        <div className="card-header">
          <div>
            <h2>Today’s work schedule</h2>
            <span>
              {day.split("-").reverse().join("/")} ·{" "}
              {technician
                ? "Appointments assigned to you"
                : "Appointments at the spa"}
            </span>
          </div>
          <Link to="/appointments">View all</Link>
        </div>
        {data.loading ? (
          <p className="ui-empty" role="status">
            Loading appointments…
          </p>
        ) : data.error ? (
          <p className="ui-empty">Could not load appointments.</p>
        ) : rows.length === 0 ? (
          <div className="ui-empty">
            <i className="bi bi-calendar2-check" />
            <p>
              {technician
                ? "You have no assignments today."
                : "No appointments today."}
            </p>
            <Link to="/appointments">View other days</Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Appointment time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.appointmentId}>
                    <td className="text-center">
                      {String(a.startTime || "").slice(0, 5)} –{" "}
                      {String(a.endTime || "").slice(0, 5)}
                    </td>
                    <td>{a.customerName}</td>
                    <td>{a.serviceNames}<small className="d-block text-muted">{a.technicianNames || ""}</small></td>
                    <td>
                      <span className="staff-status">
                        {appointmentStatusLabel(a.status)}
                      </span>
                    </td>
                    <td>
                      {role === "Receptionist" && a.status === "Pending" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary me-2"
                          disabled={approvingId === a.appointmentId}
                          onClick={() => approve(a.appointmentId)}
                        >
                          <i className="bi bi-check2-circle me-1" aria-hidden="true"></i> Confirm
                        </button>
                      )}
                      <Link
                        className="btn btn-sm btn-outline-primary"
                        to={`/appointments/${a.appointmentId}`}
                      >
                        Details
                        <span className="visually-hidden">
                          {" "}
                          appointment #{a.appointmentId}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {!technician && !data.loading && !data.error && upcomingPending.length > 0 && (
        <section className="staff-schedule card mt-4">
          <div className="card-header">
            <div>
              <h2>Upcoming pending appointments</h2>
              <span>
                {upcomingPending.length} appointments after today are waiting to be confirmed
              </span>
            </div>
            <Link to="/appointments">View all</Link>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Appointment time</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingPending.map((a) => (
                  <tr key={a.appointmentId}>
                    <td>
                      {String(a.appointmentDate)
                        .slice(0, 10)
                        .split("-")
                        .reverse()
                        .join("/")}
                    </td>
                    <td className="text-center">
                      {String(a.startTime || "").slice(0, 5)} –{" "}
                      {String(a.endTime || "").slice(0, 5)}
                    </td>
                    <td>{a.customerName}</td>
                    <td>{a.serviceNames}<small className="d-block text-muted">{a.technicianNames || ""}</small></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary me-2"
                        disabled={approvingId === a.appointmentId}
                        onClick={() => approve(a.appointmentId)}
                      >
                        <i className="bi bi-check2-circle me-1" aria-hidden="true"></i> Confirm
                      </button>
                      <Link
                        className="btn btn-sm btn-outline-primary"
                        to={`/appointments/${a.appointmentId}`}
                      >
                        Details
                        <span className="visually-hidden">
                          {" "}
                          appointment #{a.appointmentId}
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
