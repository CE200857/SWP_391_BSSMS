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
      setError(err.message || 'Could not connect to the server. Please try again.');
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
              <i className="bi bi-arrow-left" aria-hidden="true" /> Back to home page
            </Link>
          </div>
        </header>
        <div className="staff-login-content auth-page-grid">
          <section className="staff-login-intro auth-page-intro">
            <span className="home-eyebrow">WORKSPACE</span>
            <h1>Feel your best,<br />every single day.</h1>
            <p>Manage appointments, coordinate the team and run customer care.</p>
            <div className="auth-intro-note">
              <i className="bi bi-calendar2-check" aria-hidden="true" />
              <span>
                <strong>For the Seoul Center team</strong>
                <small>Manage appointments and customers.</small>
              </span>
            </div>
            <img className="staff-login-photo" src={spaPhoto} alt="Customer care at Seoul Center" />
            <small className="staff-login-caption">BSSMS · Salon &amp; spa management system</small>
          </section>
          <section className="staff-login-panel">
            <div className="staff-login-form app-login-card">
              <div className="card-body">
                <div className="position-relative mb-4">
                  <Link to="/bssms-guest" className="staff-login-card-back" aria-label="Back to home page">
                    <i className="bi bi-arrow-left" aria-hidden="true" />
                  </Link>
                  <h3 className="text-center fw-bold text-uppercase m-0">Log in</h3>
                </div>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                {user?.role === 'Customer' ? (
                  <div className="alert alert-info">You are logged in with a customer account. Log out from your profile before using a staff account. <Link to="/profile">Open profile</Link></div>
                ) : (
                  <form onSubmit={submit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold" htmlFor="staff-email">Email or phone number*</label>
                      <input className="form-control" id="staff-email" name="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Please enter your email or phone number" disabled={loading} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold" htmlFor="staff-password">Password*</label>
                      <div className="staff-password-field">
                        <input className="form-control" id="staff-password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Please enter your password" disabled={loading} />
                        <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}><i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} aria-hidden="true" /></button>
                      </div>
                    </div>
                    <button className="btn btn-primary w-100 mb-4 fw-bold" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
                  </form>
                )}
                <div className="staff-login-links d-flex flex-column text-start">
                  <Link className="auth-inline-link mb-2" to="/forgot-password?portal=staff">Forgot password?</Link>
                  <span>Need an account? Contact the manager to get access.</span>
                  <Link className="auth-inline-link mt-3" to="/login">Are you a customer? Log in here</Link>
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
