import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const amount = value => {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString('vi-VN') : '—';
};
const statusNames = { Pending:'Chờ xác nhận', 'Checked-in':'Đã đến', 'In-progress':'Đang thực hiện', 'No-show':'Không đến', Booked:'Đã đặt', Confirmed:'Đã xác nhận', 'Checked In':'Đã check-in', 'In Progress':'Đang thực hiện', Completed:'Hoàn thành', Cancelled:'Đã hủy', 'No Show':'Không đến' };
const list = value => Array.isArray(value) ? value : [];
const dayLabel = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value.split('-').reverse().join('/') : '—';
export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const response = await fetch('/api/dashboard-reports', { credentials:'include', signal:controller.signal });
        if (!response.ok) throw new Error(response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : `Không tải được báo cáo (HTTP ${response.status}). Vui lòng thử lại.`);
        const data = await response.json();
        if (!data || typeof data !== 'object' || Array.isArray(data) || !('totalRevenue' in data)) throw new Error('Dữ liệu báo cáo không đúng định dạng. Vui lòng kiểm tra back-end đang chạy.');
        if (!controller.signal.aborted) setMetrics(data);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof TypeError ? 'Không kết nối được máy chủ báo cáo. Vui lòng kiểm tra back-end.' : err.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load(); return () => controller.abort();
  }, [attempt]);
  const cash = list(metrics?.dailyCash);
  const statuses = list(metrics?.statusCounts);
  const services = list(metrics?.topServices);
  const schedule = list(metrics?.todaySchedule);
  const maxCount = Math.max(1, ...services.map(s => Number(s.completedCount) || 0));
  return <div className="manager-overview">
    <header className="overview-heading"><div><h1>Tổng quan & báo cáo</h1><p>{metrics?.today ? `Ngày ${dayLabel(metrics.today)} (giờ Việt Nam)` : 'Theo dõi hoạt động và dòng tiền của salon'}</p></div>
      <button type="button" onClick={() => setAttempt(n => n + 1)} disabled={loading}><i className="bi bi-arrow-clockwise" /> {loading ? 'Đang tải…' : 'Làm mới'}</button>
    </header>
    <section className="overview-shortcuts" aria-label="Truy cập nhanh"><Link to="/appointments">Lịch hẹn</Link><Link to="/manager/invoices">Hóa đơn & thanh toán</Link><Link to="/manager/commission/report">Báo cáo hoa hồng</Link><Link to="/manager/resources">Phòng & thiết bị</Link></section>
    {error && <div className="alert alert-danger" role="alert">{error} {metrics && 'Số liệu bên dưới là lần tải thành công trước.'}</div>}
    {loading && !metrics && <p role="status">Đang tải báo cáo...</p>}
    {!loading && !metrics && <p>Chưa tải được dữ liệu. Bấm Làm mới để thử lại.</p>}
    {metrics && <>
      <div className="overview-metrics">
        {[
          ['Thực thu sau hoàn tiền', <>{amount(metrics.totalRevenue)} <span className="overview-unit">VNĐ</span></>, 'Tất cả thời gian · Thanh toán thành công trừ hoàn tiền thành công', 'wallet2'],
          ['Lịch hẹn hôm nay', amount(metrics.todayAppointments), 'Bao gồm mọi trạng thái', 'calendar2-check'],
          ['Tổng khách hàng', amount(metrics.totalCustomers), 'Tổng hồ sơ khách hàng', 'people'],
          ['Hóa đơn chưa thanh toán', amount(metrics.unpaidInvoices), 'Đang chờ thanh toán', 'receipt'],
        ].map(([title,value,note]) => <article className="overview-metric" key={title}><span>{title}</span><strong>{value}</strong><small>{note}</small></article>)}
      </div>
      <div className="overview-grid">
        <section className="overview-panel overview-cash"><h2>Dòng tiền 7 ngày gần nhất</h2><p className="overview-note">Các khoản thu và hoàn tiền thành công, theo ngày phát sinh.</p>
          {cash.length ? <div className="overview-table-wrap"><table><thead><tr><th>Ngày</th><th>Thu (VNĐ)</th><th>Hoàn (VNĐ)</th><th>Thực thu (VNĐ)</th></tr></thead><tbody>{cash.map(row => <tr key={row.day}><td>{dayLabel(row.day)}</td><td>{amount(row.received)}</td><td>{amount(row.refunded)}</td><td className={Number(row.net)<0?'negative':'cash-net'}>{amount(row.net)}</td></tr>)}</tbody></table></div> : <p className="overview-empty">Chưa có dữ liệu dòng tiền.</p>}
        </section>
        <section className="overview-panel"><h2>Trạng thái lịch hẹn hôm nay</h2><p className="overview-note">Phân bổ theo trạng thái hiện tại.</p>
          {statuses.length ? <ul className="overview-statuses">{statuses.map(row => <li key={row.status}><span>{statusNames[row.status] || row.status}</span><strong>{amount(row.total)}</strong></li>)}</ul> : <p className="overview-empty">Hôm nay chưa có lịch hẹn.</p>}
          <Link className="overview-link" to="/appointments">Xem danh sách lịch hẹn</Link>
        </section>
        <section className="overview-panel"><div className="overview-panel-heading"><h2>Lịch hẹn hôm nay</h2><Link to="/receptionist/coordination">Điều phối</Link></div>
          {schedule.length ? <div className="overview-table-wrap"><table><thead><tr><th>Giờ</th><th>Khách hàng / Dịch vụ</th><th>Trạng thái</th><th>Chi tiết</th></tr></thead><tbody>{schedule.map(row => <tr key={row.appointmentId}><td>{String(row.startTime || '').slice(0,5)}–{String(row.endTime || '').slice(0,5)}</td><td><strong>{row.customerName}</strong><small className="overview-service-name">{row.serviceName}</small></td><td><span className="overview-status-label" data-status={row.status}>{statusNames[row.status] || row.status}</span></td><td><Link to={`/appointments/${row.appointmentId}`}>#{row.appointmentId}</Link></td></tr>)}</tbody></table></div> : <p className="overview-empty">Chưa có lịch hẹn cho ngày hôm nay.</p>}
        </section>
        <section className="overview-panel"><h2>Dịch vụ được sử dụng nhiều</h2><p className="overview-note">Top 5 theo số lịch hẹn hoàn thành · Tất cả thời gian.</p>
          {services.length ? services.map(row => <div className="overview-service" key={row.serviceId}><div><span>{row.serviceName}</span><strong>{amount(row.completedCount)} lượt</strong></div><div className="overview-bar"><span style={{width:`${Math.max(0, Math.min(100, (Number(row.completedCount)||0)/maxCount*100))}%`}} /></div></div>) : <p className="overview-empty">Chưa có lịch hẹn hoàn thành để thống kê.</p>}
        </section>
      </div>
    </>}

  </div>;
}
