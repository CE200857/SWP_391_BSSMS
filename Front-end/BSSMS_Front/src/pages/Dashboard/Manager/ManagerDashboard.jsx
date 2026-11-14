import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { appointmentStatusLabel } from '../../../utils/appointmentStatus';
import { today, addDays } from '../../../services/api';

const amount = value => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('vi-VN') : '—';
};
const list = value => Array.isArray(value) ? value : [];
const dayLabel = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value.split('-').reverse().join('/') : '—';

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState({ fromDate: addDays(today(), -29), toDate: today() });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const response = await fetch(`/api/dashboard-reports?fromDate=${range.fromDate}&toDate=${range.toDate}`, { credentials: 'include', signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || (response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : `Không tải được báo cáo (HTTP ${response.status}).`));
        if (!controller.signal.aborted) setMetrics(data);
      } catch (err) {
        if (!controller.signal.aborted && err.name !== 'AbortError') setError(err instanceof TypeError ? 'Không kết nối được máy chủ báo cáo. Vui lòng kiểm tra back-end.' : err.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load(); return () => controller.abort();
  }, [range, attempt]);

  const cash = list(metrics?.dailyCash);
  const statuses = list(metrics?.statusCounts);
  const services = list(metrics?.topServices);
  const technicians = list(metrics?.topTechnicians);
  const schedule = list(metrics?.todaySchedule);
  const maxCount = Math.max(1, ...services.map(s => Number(s.completedCount) || 0));
  const maxCash = Math.max(1, ...cash.map(c => Math.abs(Number(c.amount)) || 0));
  const period = `${dayLabel(metrics?.fromDate)} – ${dayLabel(metrics?.toDate)}`;
  const preset = days => setRange({ fromDate: addDays(today(), -(days - 1)), toDate: today() });

  return <div className="manager-overview">
    <header className="overview-heading">
      <div><h1>Tổng quan & báo cáo</h1><p>{metrics?.today ? `Hôm nay ${dayLabel(metrics.today)} · Kỳ báo cáo ${period}` : 'Theo dõi hoạt động và doanh thu của salon'}</p></div>
      <div className="d-flex gap-2 align-items-center flex-wrap">
        <input type="date" className="form-control form-control-sm" style={{ width: 150 }} value={range.fromDate} max={range.toDate} onChange={e => setRange(r => ({ ...r, fromDate: e.target.value }))} aria-label="Từ ngày" />
        <input type="date" className="form-control form-control-sm" style={{ width: 150 }} value={range.toDate} min={range.fromDate} onChange={e => setRange(r => ({ ...r, toDate: e.target.value }))} aria-label="Đến ngày" />
        <button type="button" onClick={() => preset(7)}>7 ngày</button>
        <button type="button" onClick={() => preset(30)}>30 ngày</button>
        <button type="button" onClick={() => setAttempt(n => n + 1)} disabled={loading}><i className="bi bi-arrow-clockwise" /> {loading ? 'Đang tải…' : 'Làm mới'}</button>
      </div>
    </header>
    {error && <div className="alert alert-danger" role="alert">{error} {metrics && 'Số liệu bên dưới là lần tải thành công trước.'}</div>}
    {loading && !metrics && <p role="status">Đang tải báo cáo...</p>}
    {metrics && <>
      <div className="overview-metrics">
        {[
          ['Doanh thu thực', <>{amount(metrics.totalRevenue)} <span className="overview-unit">VNĐ</span></>, `Đã thu ${amount(metrics.grossRevenue)} · hoàn ${amount(metrics.refunded)}`],
          ['Doanh thu dịch vụ / gói', <>{amount(metrics.serviceRevenue)} / {amount(metrics.packageRevenue)}</>, 'VNĐ, theo ngày thanh toán'],
          ['Lịch hẹn trong kỳ', amount(metrics.periodAppointments), `Tỷ lệ không đến ${metrics.noShowRate ?? 0}% (${amount(metrics.noShowCount)} lịch)`],
          ['Khách hàng mới', amount(metrics.newCustomers), `Tổng ${amount(metrics.totalCustomers)} khách hàng`],
          ['Lịch hẹn hôm nay', amount(metrics.todayAppointments), 'Bao gồm mọi trạng thái'],
          ['Hóa đơn chưa thanh toán', amount(metrics.unpaidInvoices), `${amount(metrics.pendingRefunds)} yêu cầu hoàn tiền đang chờ`],
        ].map(([title, value, note]) => <article className="overview-metric" key={title}><span>{title}</span><strong>{value}</strong><small>{note}</small></article>)}
      </div>
      <div className="overview-grid">
        <section className="overview-panel overview-cash"><h2>Doanh thu theo ngày</h2><p className="overview-note">Thanh toán thành công trừ hoàn tiền hoàn tất, theo ngày phát sinh.</p>
          {cash.length ? <div className="overview-table-wrap"><table><thead><tr><th>Ngày</th><th>Thực thu (VNĐ)</th><th /></tr></thead><tbody>
            {cash.filter(r => Number(r.amount) !== 0 || cash.length <= 14).map(row => <tr key={row.day}><td>{dayLabel(row.day)}</td><td className={Number(row.amount) < 0 ? 'negative' : 'cash-net'}>{amount(row.amount)}</td>
              <td style={{ width: '45%' }}><div className="overview-bar"><span style={{ width: `${Math.abs(Number(row.amount) || 0) / maxCash * 100}%` }} /></div></td></tr>)}
          </tbody></table></div> : <p className="overview-empty">Chưa có dữ liệu doanh thu.</p>}
        </section>
        <section className="overview-panel"><h2>Lịch hẹn theo trạng thái</h2><p className="overview-note">Trong kỳ báo cáo.</p>
          {statuses.length ? <ul className="overview-statuses">{statuses.map(row => <li key={row.status}><span>{appointmentStatusLabel(row.status)}</span><strong>{amount(row.total)}</strong></li>)}</ul> : <p className="overview-empty">Chưa có lịch hẹn trong kỳ.</p>}
          <Link className="overview-link" to="/appointments">Xem danh sách lịch hẹn</Link>
        </section>
        <section className="overview-panel"><div className="overview-panel-heading"><h2>Lịch hẹn hôm nay</h2><Link to="/appointments">Xem tất cả</Link></div>
          {schedule.length ? <div className="overview-table-wrap"><table><thead><tr><th>Giờ</th><th>Khách hàng / Dịch vụ</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead><tbody>{schedule.map(row => <tr key={row.appointmentId}><td>{String(row.startTime || '').slice(0, 5)}–{String(row.endTime || '').slice(0, 5)}</td><td><strong>{row.customerName}</strong><small className="overview-service-name">{row.serviceName}</small></td><td><span className="overview-status-label" data-status={row.status}>{appointmentStatusLabel(row.status)}</span></td><td><Link to={`/appointments/${row.appointmentId}`}>#{row.appointmentId}</Link></td></tr>)}</tbody></table></div> : <p className="overview-empty">Chưa có lịch hẹn cho ngày hôm nay.</p>}
        </section>
        <section className="overview-panel"><h2>Dịch vụ được sử dụng nhiều</h2><p className="overview-note">Top 5 theo số lượt hoàn thành trong kỳ.</p>
          {services.length ? services.map(row => <div className="overview-service" key={row.serviceId}><div><span>{row.serviceName}</span><strong>{amount(row.completedCount)} lượt · {amount(row.revenue)} đ</strong></div><div className="overview-bar"><span style={{ width: `${Math.max(0, Math.min(100, (Number(row.completedCount) || 0) / maxCount * 100))}%` }} /></div></div>) : <p className="overview-empty">Chưa có dịch vụ hoàn thành trong kỳ.</p>}
        </section>
        <section className="overview-panel"><h2>Kỹ thuật viên nhiều tour nhất</h2><p className="overview-note">Theo số tour thực làm trong kỳ.</p>
          {technicians.length ? <ul className="overview-statuses">{technicians.map(row => <li key={row.staffId}><span>{row.fullName}</span><strong>{amount(row.tours)} tour · {amount(row.completedCount)} lượt</strong></li>)}</ul> : <p className="overview-empty">Chưa có dữ liệu.</p>}
          <Link className="overview-link" to="/manager/tour-report">Báo cáo tour theo ngày</Link>
        </section>
      </div>
    </>}
  </div>;
}
