export const staffRoles = ['Manager', 'Receptionist', 'Technician'];

export function roleHome(role) {
  return {
    Customer: '/customer/home', Manager: '/manager/dashboard',
    Receptionist: '/receptionist/dashboard', Technician: '/technician/dashboard',
  }[role] || '/bssms-guest';
}

export function loginDestination(role, from) {
  // Only resume local application routes. Route guards still check the user's role.
  if (typeof from === 'string' && /^\/(slots|services|appointments|customer|manager|receptionist|technician)(\/|\?|$)/.test(from)) {
    return from;
  }
  return roleHome(role);
}

export async function loginAccount(email, password, portal) {
  const response = await fetch('/api/login', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Đăng nhập thất bại.');
  const allowed = portal === 'staff' ? staffRoles.includes(data.role) : data.role === 'Customer';
  if (!allowed) {
    // Login has created a server session; end it before rejecting the wrong portal.
    localStorage.removeItem('user');
    const logout = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    if (!logout.ok) throw new Error('Không thể kết thúc phiên đăng nhập. Vui lòng thử lại.');
    throw new Error(portal === 'staff'
      ? 'Tài khoản không có quyền truy cập hệ thống quản lý. Vui lòng dùng trang đăng nhập khách hàng.'
      : 'Tài khoản nhân viên vui lòng đăng nhập tại trang Dashboard.');
  }
  return data;
}
