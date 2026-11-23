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
        if (!response.ok) throw new Error(data?.message || (response.status === 401 ? 'Your session has expired. Please log in again.' : `Could not load the report (HTTP ${response.status}).`));
        if (!controller.signal.aborted) setMetrics(data);
      } catch (err) {
        if (!controller.signal.aborted && err.name !== 'AbortError') setError(err instanceof TypeError ? 'Could not connect to the report server. Please check the back-end.' : err.message);
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
      <div><h1>Overview & reports</h1><p>{metrics?.today ? `Today ${dayLabel(metrics.today)} · Report period ${period}` : 'Track the spa’s activity and revenue'}</p></div>
      <div className="d-flex gap-2 align-items-center flex-wrap">
        <input type="date" className="form-control form-control-sm" style={{ width: 150 }} value={range.fromDate} max={range.toDate} onChange={e => setRange(r => ({ ...r, fromDate: e.target.value }))} aria-label="From date" />
        <input type="date" className="form-control form-control-sm" style={{ width: 150 }} value={range.toDate} min={range.fromDate} onChange={e => setRange(r => ({ ...r, toDate: e.target.value }))} aria-label="To date" />
        <button type="button" onClick={() => preset(7)}>7 days</button>
        <button type="button" onClick={() => preset(30)}>30 days</button>
        <button type="button" onClick={() => setAttempt(n => n + 1)} disabled={loading}><i className="bi bi-arrow-clockwise" /> {loading ? 'Loading…' : 'Refresh'}</button>
      </div>
    </header>
    {error && <div className="alert alert-danger" role="alert">{error} {metrics && 'The figures below are from the last successful load.'}</div>}
    {loading && !metrics && <p role="status">Loading report...</p>}
    {metrics && <>
      <div className="overview-metrics">
        {[
          ['Net revenue', <>{amount(metrics.totalRevenue)} <span className="overview-unit">VND</span></>, `Collected ${amount(metrics.grossRevenue)} · refund ${amount(metrics.refunded)}`],
          ['Service / package revenue', <>{amount(metrics.serviceRevenue)} / {amount(metrics.packageRevenue)}</>, 'VND, by payment date'],
          ['Appointments in this period', amount(metrics.periodAppointments), `No-show rate ${metrics.noShowRate ?? 0}% (${amount(metrics.noShowCount)} appointments)`],
          ['New customer', amount(metrics.newCustomers), `Total ${amount(metrics.totalCustomers)} customers`],
          ['Today’s appointments', amount(metrics.todayAppointments), 'Includes all statuses'],
          ['Unpaid invoices', amount(metrics.unpaidInvoices), `${amount(metrics.pendingRefunds)} pending refund requests`],
        ].map(([title, value, note]) => <article className="overview-metric" key={title}><span>{title}</span><strong>{value}</strong><small>{note}</small></article>)}
      </div>
      <div className="overview-grid">
        <section className="overview-panel overview-cash"><h2>Revenue by day</h2><p className="overview-note">Successful payments minus completed refunds, by transaction date.</p>
          {cash.length ? <div className="overview-table-wrap"><table><thead><tr><th>Date</th><th>Amount received (VND)</th><th /></tr></thead><tbody>
            {cash.filter(r => Number(r.amount) !== 0 || cash.length <= 14).map(row => <tr key={row.day}><td>{dayLabel(row.day)}</td><td className={Number(row.amount) < 0 ? 'negative' : 'cash-net'}>{amount(row.amount)}</td>
              <td style={{ width: '45%' }}><div className="overview-bar"><span style={{ width: `${Math.abs(Number(row.amount) || 0) / maxCash * 100}%` }} /></div></td></tr>)}
          </tbody></table></div> : <p className="overview-empty">No revenue data yet.</p>}
        </section>
        <section className="overview-panel"><h2>Appointments by status</h2><p className="overview-note">In the report period.</p>
          {statuses.length ? <ul className="overview-statuses">{statuses.map(row => <li key={row.status}><span>{appointmentStatusLabel(row.status)}</span><strong>{amount(row.total)}</strong></li>)}</ul> : <p className="overview-empty">No appointments in this period.</p>}
          <Link className="overview-link" to="/appointments">View appointment list</Link>
        </section>
        <section className="overview-panel"><div className="overview-panel-heading"><h2>Today’s appointments</h2><Link to="/appointments">View all</Link></div>
          {schedule.length ? <div className="overview-table-wrap"><table><thead><tr><th>Time</th><th>Customer / Service</th><th>Status</th><th>Details</th></tr></thead><tbody>{schedule.map(row => <tr key={row.appointmentId}><td>{String(row.startTime || '').slice(0, 5)}–{String(row.endTime || '').slice(0, 5)}</td><td><strong>{row.customerName}</strong><small className="overview-service-name">{row.serviceName}</small></td><td><span className="overview-status-label" data-status={row.status}>{appointmentStatusLabel(row.status)}</span></td><td><Link to={`/appointments/${row.appointmentId}`}>#{row.appointmentId}</Link></td></tr>)}</tbody></table></div> : <p className="overview-empty">No appointments for today.</p>}
        </section>
        <section className="overview-panel"><h2>Most used services</h2><p className="overview-note">Top 5 by completions in the period.</p>
          {services.length ? services.map(row => <div className="overview-service" key={row.serviceId}><div><span>{row.serviceName}</span><strong>{amount(row.completedCount)} uses · {amount(row.revenue)} VND</strong></div><div className="overview-bar"><span style={{ width: `${Math.max(0, Math.min(100, (Number(row.completedCount) || 0) / maxCount * 100))}%` }} /></div></div>) : <p className="overview-empty">No completed services in this period.</p>}
        </section>
        <section className="overview-panel"><h2>Technician with the most tours</h2><p className="overview-note">By tours actually done in the period.</p>
          {technicians.length ? <ul className="overview-statuses">{technicians.map(row => <li key={row.staffId}><span>{row.fullName}</span><strong>{amount(row.tours)} tour · {amount(row.completedCount)} uses</strong></li>)}</ul> : <p className="overview-empty">No data yet.</p>}
          <Link className="overview-link" to="/manager/tour-report">Daily tour report</Link>
        </section>
      </div>
    </>}
  </div>;
}
