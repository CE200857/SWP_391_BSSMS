import { Container } from 'react-bootstrap';

export default function ManagerDashboard() {
  return (
    <Container className="mt-5">
      <h1 className="text-danger">Bảng điều khiển Quản Lý (Manager)</h1>
      <p>Khu vực quản lý nhân viên, quản lý khách hàng và xem báo cáo doanh thu.</p>
    </Container>
  );
}