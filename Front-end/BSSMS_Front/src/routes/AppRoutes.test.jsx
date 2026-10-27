import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

const renderRoute = (path, user = null) => renderToString(
  <MemoryRouter initialEntries={[path]}>
    <AppRoutes user={user} setUser={vi.fn()} />
  </MemoryRouter>
);

describe('Guest routes', () => {
  beforeEach(() => {
    globalThis.localStorage = { getItem: vi.fn(() => null) };
  });

  it('shows only public navigation on the service catalog', () => {
    const html = renderRoute('/guest/services');

    expect(html).toContain('Trang chủ');
    expect(html).toContain('Danh sách dịch vụ');
    expect(html).toContain('Tra cứu lịch trống');
    expect(html).toContain('Đăng nhập');
    expect(html).not.toContain('Lịch hẹn');
  });

  it('renders the public service detail route', () => {
    const html = renderRoute('/guest/services/42');

    expect(html).toContain('Chi tiết dịch vụ');
    expect(html).toContain('Đang tải thông tin dịch vụ');
  });

  it('renders public slot lookup without customer-only controls', () => {
    const html = renderRoute('/guest/slots');

    expect(html).toContain('Tra cứu lịch trống');
    expect(html).toContain('Tìm khung giờ dành cho bạn');
    expect(html).toContain('Chọn dịch vụ để tra cứu lịch trống');
    expect(html).not.toContain('Tạo lịch tại quầy');
  });
});

describe('Customer booking route', () => {
  it('renders the appointment form and booking summary', () => {
    const html = renderRoute('/appointments/online', {
      role: 'Customer',
      fullName: 'Khách hàng',
    });

    expect(html).toContain('Đặt lịch hẹn online');
    expect(html).toContain('Hình thức sử dụng dịch vụ');
    expect(html).toContain('Thông tin đặt hẹn');
    expect(html).toContain('Xác nhận Đặt lịch Online');
  });
});
