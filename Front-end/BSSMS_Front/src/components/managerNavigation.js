export const managerGroups = [
  ['booking', 'Lịch hẹn & điều trị', 'calendar2-week', [
    ['/appointments', 'Danh sách lịch hẹn'],
    ['/receptionist/coordination', 'Check-in & điều phối'], ['/service-history', 'Lịch sử dịch vụ'],
    ['/treatment-status', 'Trạng thái điều trị'], 
    ['/my-treatment-profile', 'Hồ sơ liệu trình'],
  ]],
  ['catalog', 'Dịch vụ & gói liệu trình', 'scissors', [
    ['/services', 'Danh sách dịch vụ'],
    ['/manager/treatment-packages', 'Gói liệu trình'], ['/manager/catalog-rules', 'Định mức & thiết bị'],
  ]],
  ['customers', 'Khách hàng & ưu đãi', 'people', [
    ['/customers', 'Danh sách khách hàng'], ['/feedback', 'Đánh giá khách hàng'],
    ['/membership-benefits', 'Quyền lợi thành viên'], ['/manager/membership-tiers', 'Hạng thành viên'],
    ['/vouchers', 'Voucher'], ['/birthday-promotions', 'Ưu đãi sinh nhật'],
  ]],
  ['staff', 'Nhân sự', 'person-badge', [['/staffs', 'Danh sách nhân viên'], ['/manager/scheduling', 'Ca làm & kỹ năng']]],
  ['resources', 'Phòng & thiết bị', 'building', [['/manager/resources', 'Quản lý tài nguyên'], ['/update-room-bed-status', 'Trạng thái phòng & giường']]],
  ['stock', 'Kho & nhà cung cấp', 'box-seam', [['/manager/products', 'Sản phẩm'], ['/manager/suppliers', 'Nhà cung cấp'], ['/manager/purchase-orders', 'Đơn nhập hàng'], ['/manager/stock', 'Tồn kho & biến động']]],
  ['finance', 'Hóa đơn & hoa hồng', 'receipt', [['/manager/invoices', 'Hóa đơn & thanh toán'], ['/manager/commission/report', 'Báo cáo hoa hồng'], ['/manager/policy', 'Chính sách & chốt tháng']]],
];

export function managerSection(pathname) {
  const aliases = { '/invoices': '/manager/invoices', '/products': '/manager/products', '/suppliers': '/manager/suppliers', '/manager/update-service-status': '/services', '/manager/create-staff': '/staffs', '/treatment-packages': '/manager/treatment-packages' };
  const path = aliases[pathname] || (pathname === '/treatment-packages' ? '/manager/treatment-packages'
    : pathname.startsWith('/treatment-profile/') ? '/my-treatment-profile' : pathname);
  return managerGroups.flatMap(group => group[3].map(link => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + '/'))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
