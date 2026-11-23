export const managerGroups = [
  // The manager inherits every receptionist function, plus the management-only pages
  ['booking', 'Appointments & treatment', 'calendar2-week', [
    ['/receptionist/dashboard', 'Receptionist overview'],
    ['/appointments', 'Appointment list'],
    ['/treatment-status', 'Service status'],
    ['/service-history', 'Service history'],
  ]],
  ['catalog', 'Service & treatment packages', 'scissors', [
    ['/services', 'Service list'],
    ['/manager/treatment-packages', 'Treatment package'],
  ]],
  ['customers', 'Customer & experience', 'people', [
    ['/customers', 'Customer list'],
    ['/my-treatment-profile', 'Customer care profiles'],
    ['/feedback', 'Review management'],
    ['/manager/membership-tiers', 'Membership tier'],
    ['/vouchers', 'Voucher'],
  ]],
  ['staff', 'Staff', 'person-badge', [
    ['/staffs', 'Staff list'],
    ['/manager/scheduling', 'Shifts & skills'],
    ['/manager/leaves', 'Leave approval'],
    ['/manager/tour-report', 'Tour report'],
    ['/my-schedule', 'My shifts & leave'],
  ]],
  ['resources', 'Facilities', 'building', [
    ['/manager/resources', 'Rooms & beds'],
    ['/room-bed-board', 'Room status & beds'],
  ]],
  ['finance', 'Payments & finance', 'receipt', [
    ['/invoices/create', 'Take payment for appointment'],
    ['/sell-treatment-package', 'Sell treatment package'],
    ['/manager/invoices', 'Invoice & refund'],
  ]],
];

export function managerSection(pathname) {
  const aliases = {
    '/invoices': '/manager/invoices', '/manager/create-staff': '/staffs', '/treatment-packages': '/manager/treatment-packages',
    '/manager/feedback-moderation': '/feedback', '/membership-benefits': '/manager/membership-tiers', '/update-room-bed-status': '/manager/resources',
    '/appointments/create': '/appointments', '/receptionist/create-walkin': '/customers', '/receptionist/coordination': '/receptionist/dashboard', '/tour-report': '/manager/tour-report',
  };
  const path = aliases[pathname] || (pathname.startsWith('/treatment-profile/') ? '/my-treatment-profile' : pathname);
  return managerGroups.flatMap(group => group[3].map(link => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + '/'))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
