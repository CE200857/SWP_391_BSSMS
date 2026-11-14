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
          throw new Error("Dữ liệu lịch hẹn không hợp lệ.");
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
      technician ? "Lịch được giao hôm nay" : "Lịch hẹn hôm nay",
      rows.length,
    ],
    [
      technician ? "hourglass-split" : "clock",
      technician ? "Sẵn sàng thực hiện" : "Chờ xác nhận hôm nay",
      rows.filter((a) => a.status === (technician ? "Checked-in" : "Pending"))
        .length,
    ],
    [
      "activity",
      "Đang thực hiện",
      rows.filter((a) => a.status === "In-progress").length,
    ],
    [
      "check2-circle",
      "Đã hoàn thành",
      rows.filter((a) => a.status === "Completed").length,
    ],
  ];
  return (
    <section className="staff-overview">
      <div className="ui-page-heading">
        <div>
          <h1>{technician ? "Công việc hôm nay" : "Tổng quan lễ tân"}</h1>
          <p>
            {technician
              ? "Theo dõi lịch được phân công và tiếp tục buổi điều trị."
              : "Đón khách, sắp xếp lịch hẹn và theo dõi hoạt động tại quầy."}
          </p>
        </div>
        <div className="d-flex gap-2">
        <Link className="btn btn-primary" to={technician ? "/treatment-status" : "/receptionist/coordination"}>
          <i className={`bi ${technician ? "bi-play-circle" : "bi-door-open"}`} aria-hidden="true" />{" "}
          {technician ? "Trạng thái dịch vụ" : "Check-in & điều phối"}
        </Link>
        <button
          className="btn btn-outline-primary"
          disabled={data.loading}
          onClick={() => {
            setData((current) => ({ ...current, loading: true, error: "" }));
            setRevision((value) => value + 1);
          }}
        >
          <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Làm mới
        </button>
        </div>
      </div>
      {data.error && (
        <div className="alert alert-danger" role="alert">
          {data.error} Bấm Làm mới để thử lại.
        </div>
      )}
      <div
        className="staff-metrics"
        aria-label="Thống kê hôm nay"
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
            <h2>Lịch làm việc hôm nay</h2>
            <span>
              {day.split("-").reverse().join("/")} ·{" "}
              {technician
                ? "Các lịch hẹn được phân công cho bạn"
                : "Các lịch hẹn tại salon"}
            </span>
          </div>
          <Link to="/appointments">Xem tất cả</Link>
        </div>
        {data.loading ? (
          <p className="ui-empty" role="status">
            Đang tải lịch hẹn…
          </p>
        ) : data.error ? (
          <p className="ui-empty">Chưa tải được lịch hẹn.</p>
        ) : rows.length === 0 ? (
          <div className="ui-empty">
            <i className="bi bi-calendar2-check" />
            <p>
              {technician
                ? "Bạn chưa có lịch được phân công hôm nay."
                : "Chưa có lịch hẹn hôm nay."}
            </p>
            <Link to="/appointments">Xem lịch các ngày khác</Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Giờ hẹn</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Hành động</th>
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
                          Duyệt
                        </button>
                      )}
                      <Link
                        className="btn btn-sm btn-outline-primary"
                        to={`/appointments/${a.appointmentId}`}
                      >
                        Chi tiết
                        <span className="visually-hidden">
                          {" "}
                          lịch #{a.appointmentId}
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
              <h2>Chờ xác nhận sắp tới</h2>
              <span>
                {upcomingPending.length} lịch hẹn của các ngày sau hôm nay đang chờ bạn duyệt
              </span>
            </div>
            <Link to="/appointments">Xem tất cả</Link>
          </div>
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giờ hẹn</th>
                  <th>Khách hàng</th>
                  <th>Dịch vụ</th>
                  <th className="text-center">Hành động</th>
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
                        Duyệt
                      </button>
                      <Link
                        className="btn btn-sm btn-outline-primary"
                        to={`/appointments/${a.appointmentId}`}
                      >
                        Chi tiết
                        <span className="visually-hidden">
                          {" "}
                          lịch #{a.appointmentId}
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
