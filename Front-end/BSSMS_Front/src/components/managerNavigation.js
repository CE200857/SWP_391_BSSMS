export const managerGroups = [
  ['booking', 'Lịch hẹn & điều trị', 'calendar2-week', [
    ['/appointments', 'Danh sách lịch hẹn'],
    ['/service-history', 'Lịch sử dịch vụ'],
    ['/my-treatment-profile', 'Quản lý liệu trình & trạng thái'],
  ]],
  ['catalog', 'Dịch vụ, liệu trình & định mức', 'scissors', [
    ['/services', 'Danh sách dịch vụ'],
    ['/manager/treatment-packages', 'Gói liệu trình'], ['/manager/catalog-rules', 'Định mức & thiết bị'],
  ]],
  ['customers', 'Khách hàng & trải nghiệm', 'people', [
    ['/customers', 'Danh sách khách hàng'], ['/feedback', 'Quản lý đánh giá'],
    ['/manager/membership-tiers', 'Quyền lợi & hạng thành viên'],
    ['/vouchers', 'Voucher & ưu đãi sinh nhật'],
  ]],
  ['staff', 'Nhân sự', 'person-badge', [['/staffs', 'Danh sách nhân viên'], ['/manager/scheduling', 'Ca làm & kỹ năng'], ['/manager/commission/report', 'Hoa hồng nhân viên']]],
  ['resources', 'Cơ sở vật chất', 'building', [['/manager/resources', 'Quản lý tài nguyên']]],
  ['stock', 'Kho & nhập hàng', 'box-seam', [['/manager/products', 'Sản phẩm'], ['/manager/suppliers', 'Nhà cung cấp'], ['/manager/purchase-orders', 'Đơn nhập hàng'], ['/manager/stock', 'Tồn kho & biến động']]],
  ['finance', 'Tài chính & chốt tháng', 'receipt', [['/manager/invoices', 'Hóa đơn & thanh toán'], ['/manager/policy', 'Chính sách & chốt tháng']]],
];

export function managerSection(pathname) {
  const aliases = { '/invoices': '/manager/invoices', '/products': '/manager/products', '/suppliers': '/manager/suppliers', '/manager/update-service-status': '/services', '/manager/create-staff': '/staffs', '/treatment-packages': '/manager/treatment-packages', '/treatment-status': '/my-treatment-profile', '/manager/feedback-moderation': '/feedback', '/membership-benefits': '/manager/membership-tiers', '/birthday-promotions': '/vouchers', '/update-room-bed-status': '/manager/resources' };
  const path = aliases[pathname] || (pathname === '/treatment-packages' ? '/manager/treatment-packages'
    : pathname.startsWith('/treatment-profile/') ? '/my-treatment-profile' : pathname);
  return managerGroups.flatMap(group => group[3].map(link => ({ group, link })))
    .filter(({ link }) => path === link[0] || path.startsWith(link[0] + '/'))
    .sort((a, b) => b.link[0].length - a.link[0].length)[0];
}
