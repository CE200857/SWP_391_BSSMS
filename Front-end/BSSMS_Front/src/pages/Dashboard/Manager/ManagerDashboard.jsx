import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/dashboard-reports', { withCredentials: true });
        setMetrics(response.data);
      } catch (error) {
        console.error("Lỗi tải báo cáo:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="danger" />
        <p className="mt-3 text-muted">Đang tải dữ liệu tổng quan...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 px-4">
      <h2 className="fw-bold text-uppercase mb-4" style={{ color: "#71143f" }}>
        Bảng điều khiển Quản Lý
      </h2>

      <Row className="g-4 mb-4">
        {/* Card 1: Doanh thu */}
        <Col md={4}>
          <Card className="manager-metric-card manager-metric-card--revenue shadow-sm border-0 h-100">
            <Card.Body className="d-flex align-items-center p-4">
              <div className="me-4 rounded-circle bg-white d-flex justify-content-center align-items-center" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-wallet2 manager-metric-icon fs-3"></i>
              </div>
              <div>
                <h6 className="mb-1 text-white-50 fw-bold text-uppercase">Doanh thu dự kiến</h6>
                <h3 className="mb-0 fw-bold">
                  {metrics?.totalRevenue ? Number(metrics.totalRevenue).toLocaleString('vi-VN') : 0} <span className="fs-6">VNĐ</span>
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 2: Lịch hẹn hôm nay */}
        <Col md={4}>
          <Card className="manager-metric-card manager-metric-card--appointments shadow-sm border-0 h-100">
            <Card.Body className="d-flex align-items-center p-4">
              <div className="me-4 rounded-circle bg-white d-flex justify-content-center align-items-center" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-calendar-check manager-metric-icon fs-3"></i>
              </div>
              <div>
                <h6 className="mb-1 text-white-50 fw-bold text-uppercase">Lịch hẹn hôm nay</h6>
                <h3 className="mb-0 fw-bold">
                  {metrics?.todayAppointments || 0} <span className="fs-6">Lịch</span>
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 3: Tổng khách hàng */}
        <Col md={4}>
          <Card className="manager-metric-card manager-metric-card--customers shadow-sm border-0 h-100">
            <Card.Body className="d-flex align-items-center p-4">
              <div className="me-4 rounded-circle bg-white d-flex justify-content-center align-items-center" style={{ width: "60px", height: "60px" }}>
                <i className="bi bi-people-fill manager-metric-icon fs-3"></i>
              </div>
              <div>
                <h6 className="mb-1 text-white-50 fw-bold text-uppercase">Tổng Khách hàng</h6>
                <h3 className="mb-0 fw-bold">
                  {metrics?.totalCustomers || 0} <span className="fs-6">Người</span>
                </h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}