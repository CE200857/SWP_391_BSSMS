import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAccount, loginDestination, roleHome, staffRoles } from '../../auth/login';

export default function DashboardLogin({ user, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  if (staffRoles.includes(user?.role)) return <Navigate to={roleHome(user.role)} replace />;

  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const data = await loginAccount(email, password, 'staff');
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      navigate(loginDestination(data.role, location.state?.from), { replace: true });
    } catch (err) {
      localStorage.removeItem('user');
      setUser(null);
      setError(err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="staff-login">
      <section className="staff-login-intro">
        <Link to="/bssms-guest" className="staff-login-brand"><i className="bi bi-flower1" aria-hidden="true" /> BSSMS <span>STAFF PORTAL</span></Link>
        <div className="staff-login-story">
          <span className="staff-login-eyebrow">KHÔNG GIAN LÀM VIỆC</span>
          <h1>Mỗi ngày chỉn chu.<br />Mỗi khách hàng hài lòng.</h1>
          <p>Quản lý lịch hẹn, phối hợp đội ngũ và chăm sóc khách hàng trong cùng một hệ thống.</p>
          <div className="staff-login-features">
            <span><i className="bi bi-calendar2-check" aria-hidden="true" /> Lịch hẹn &amp; điều phối</span>
            <span><i className="bi bi-people" aria-hidden="true" /> Đội ngũ &amp; khách hàng</span>
            <span><i className="bi bi-bar-chart" aria-hidden="true" /> Báo cáo &amp; vận hành</span>
          </div>
        </div>
        <small>BSSMS · Hệ thống quản lý salon &amp; spa</small>
      </section>
      <section className="staff-login-panel">
        <Link to="/bssms-guest" className="staff-login-back"><i className="bi bi-arrow-left" aria-hidden="true" /> Về trang chủ</Link>
        <div className="staff-login-form">
          <div className="staff-login-icon"><i className="bi bi-shield-lock" aria-hidden="true" /></div>
          <h2>Đăng nhập Dashboard</h2>
          <p>Dành cho Quản lý, Lễ tân và Kỹ thuật viên.</p>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {user?.role === 'Customer' ? (
            <div className="alert alert-info">Bạn đang đăng nhập bằng tài khoản khách hàng. Hãy đăng xuất trong hồ sơ trước khi dùng tài khoản nhân viên. <Link to="/profile">Mở hồ sơ</Link></div>
          ) : (
            <form onSubmit={submit}>
              <label htmlFor="staff-email">Email hoặc số điện thoại</label>
              <input id="staff-email" name="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email hoặc số điện thoại" disabled={loading} />
              <label htmlFor="staff-password">Mật khẩu</label>
              <div className="staff-password-field">
                <input id="staff-password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" disabled={loading} />
                <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" /></button>
              </div>
              <Link className="staff-login-forgot" to="/forgot-password?portal=staff">Quên mật khẩu?</Link>
              <button className="staff-login-submit" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'} <i className="bi bi-arrow-right" aria-hidden="true" /></button>
            </form>
          )}
          <div className="staff-login-help"><i className="bi bi-info-circle" aria-hidden="true" /> Cần tài khoản? Liên hệ quản lý để được cấp quyền.</div>
          <Link className="staff-login-customer" to="/login">Bạn là khách hàng? Đăng nhập tại đây</Link>
        </div>
      </section>
    </main>
  );
}
