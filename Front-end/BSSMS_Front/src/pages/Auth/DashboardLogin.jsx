import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginAccount, loginDestination, roleHome, staffRoles } from '../../auth/login';
import Footer from '../../components/Footer';
import SeoulBrand from '../../components/SeoulBrand';
import spaPhoto from '../../assets/figma/login-spa-original.jpeg';

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
    <>
      <main className="staff-login">
        <header className="staff-login-header">
          <div className="staff-login-header-inner">
            <Link to="/bssms-guest" className="staff-login-brand">
              <SeoulBrand />
              <span className="staff-login-portal">STAFF PORTAL</span>
            </Link>
            <Link to="/bssms-guest" className="staff-login-back">
              <i className="bi bi-arrow-left" aria-hidden="true" /> Về trang chủ
            </Link>
          </div>
        </header>
        <div className="staff-login-content auth-page-grid">
          <section className="staff-login-intro auth-page-intro">
            <span className="home-eyebrow">KHÔNG GIAN LÀM VIỆC</span>
            <h1>Mỗi ngày chỉn chu.<br />Mỗi khách hàng hài lòng.</h1>
            <p>Quản lý lịch hẹn, phối hợp đội ngũ và vận hành chăm sóc khách hàng.</p>
            <div className="auth-intro-note">
              <i className="bi bi-calendar2-check" aria-hidden="true" />
              <span>
                <strong>Dành cho đội ngũ Seoul Center</strong>
                <small>Quản lý lịch hẹn và khách hàng.</small>
              </span>
            </div>
            <img className="staff-login-photo" src={spaPhoto} alt="Chăm sóc khách hàng tại Seoul Center" />
            <small className="staff-login-caption">BSSMS · Hệ thống quản lý salon &amp; spa</small>
          </section>
          <section className="staff-login-panel">
            <div className="staff-login-form app-login-card">
              <div className="card-body">
                <div className="position-relative mb-4">
                  <Link to="/bssms-guest" className="staff-login-card-back" aria-label="Quay lại trang chủ">
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                  </Link>
                  <h3 className="text-center fw-bold text-uppercase m-0">Đăng nhập</h3>
                </div>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {user?.role === 'Customer' ? (
                  <div className="alert alert-info">Bạn đang đăng nhập bằng tài khoản khách hàng. Hãy đăng xuất trong hồ sơ trước khi dùng tài khoản nhân viên. <Link to="/profile">Mở hồ sơ</Link></div>
                ) : (
                  <form onSubmit={submit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="staff-email">Email hoặc Số điện thoại*</label>
                      <input className="form-control" id="staff-email" name="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Vui lòng nhập email hoặc sđt" disabled={loading} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold" htmlFor="staff-password">Mật khẩu*</label>
                      <div className="staff-password-field">
                        <input className="form-control" id="staff-password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Vui lòng nhập mật khẩu" disabled={loading} />
                        <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" /></button>
                      </div>
                    </div>
                    <button className="btn btn-primary w-100 mb-4 fw-bold" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
                  </form>
                )}
                <div className="staff-login-links d-flex flex-column text-start">
                  <Link className="auth-inline-link mb-2" to="/forgot-password?portal=staff">Quên mật khẩu?</Link>
                  <span>Cần tài khoản? Liên hệ quản lý để được cấp quyền.</span>
                  <Link className="auth-inline-link mt-3" to="/login">Bạn là khách hàng? Đăng nhập tại đây</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer user={user} />
    </>
  );
}
