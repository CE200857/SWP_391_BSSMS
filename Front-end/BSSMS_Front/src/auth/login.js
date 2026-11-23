export const staffRoles = ['Manager', 'Receptionist', 'Technician'];

export function roleHome(role) {
  return {
    Customer: '/customer/home', Manager: '/manager/dashboard',
    Receptionist: '/receptionist/dashboard', Technician: '/technician/dashboard',
  }[role] || '/bssms-guest';
}

export function loginDestination(role, from) {
  if (typeof from === 'string' && /^\/(slots|services|treatment-packages|appointments|customer|manager|receptionist|technician)(\/|\?|$)/.test(from)) {
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
  if (!response.ok) throw new Error(data.message || 'Login failed.');
  const allowed = portal === 'staff' ? staffRoles.includes(data.role) : data.role === 'Customer';
  if (!allowed) {
    localStorage.removeItem('user');
    const logout = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    if (!logout.ok) throw new Error('Could not end the session. Please try again.');
    throw new Error(portal === 'staff'
      ? 'This account cannot access the management system. Please use the customer login page.'
      : 'Staff accounts please log in at the Dashboard page.');
  }
  return data;
}
