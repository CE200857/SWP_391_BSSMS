export const managerGroups = [
  ['booking', 'Lịch hẹn & điều trị', 'calendar2-week', [
    ['/appointments', 'Danh sách lịch hẹn'],
    ['/slots', 'Tra cứu lịch trống'],
    ['/treatment-status', 'Trạng thái dịch vụ'],
    ['/service-history', 'Lịch sử dịch vụ'],
  ]],
  ['catalog', 'Dịch vụ & gói liệu trình', 'scissors', [
    ['/services', 'Danh sách dịch vụ'],
    ['/manager/treatment-packages', 'Gói liệu trình'],
  ]],
  ['customers', 'Khách hàng & trải nghiệm', 'people', [
    ['/customers', 'Danh sách khách hàng'],
    ['/my-treatment-profile', 'Hồ sơ & liệu trình khách'],
    ['/feedback', 'Quản lý đánh giá'],
    ['/manager/membership-tiers', 'Hạng thành viên'],
    ['/vouchers', 'Voucher'],
  ]],
  ['staff', 'Nhân sự', 'person-badge', [
    ['/staffs', 'Danh sách nhân viên'],
    ['/manager/scheduling', 'Ca làm & kỹ năng'],
    ['/receptionist/coordination', 'Điều phối nhân viên'],
    ['/manager/leaves', 'Duyệt nghỉ phép'],
    ['/manager/tour-report', 'Báo cáo tour'],
  ]],
  ['resources', 'Cơ sở vật chất', 'building', [
    ['/manager/resources', 'Phòng & giường'],
    ['/room-bed-board', 'Trạng thái phòng & giường'],
  ]],
  ['finance', 'Tài chính', 'receipt', [['/manager/invoices', 'Hóa đơn & hoàn tiền']]],
];

export function managerSection(pathname) {
  const aliases = {
    '/invoices': '/manager/invoices', '/manager/create-staff': '/staffs', '/treatment-packages': '/manager/treatment-packages',
    '/manager/feedback-moderation': '/feedback', '/membership-benefits': '/manager/membership-tiers', '/update-room-bed-status': '/manager/resources',
  };
  const path = aliases[pathname] || (pathname.startsWith('/treatment-profile/') ? '/my-treatment-profile' : pathname);
  return managerGroups.flatMap(group => group[3].map(link => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + '/'))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
