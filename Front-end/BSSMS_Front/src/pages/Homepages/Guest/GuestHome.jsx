import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';

export default function HomeGuest() {
  return (
    <Container className="text-center mt-5">
      <h1>Trang chủ Khách Vãng Lai (Guest)</h1>
      <p className="mt-3">Chào mừng bạn đến với hệ thống. Vui lòng đăng nhập để sử dụng dịch vụ.</p>
      <Link to="/login">
        <Button variant="primary" className="mt-2">Đi đến trang Đăng nhập</Button>
      </Link>
    </Container>
  );
}