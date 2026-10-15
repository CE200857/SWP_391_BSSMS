import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Table,
    Badge,
    Form,
    InputGroup,
    Button
} from "react-bootstrap";

const AppointmentList = () => {
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Lấy thông tin user hiện tại từ localStorage để phân quyền hiển thị nút
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isManagerOrReceptionist = user?.role === "Manager" || user?.role === "Receptionist";

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await fetch("/api/appointments", {
                    credentials: "include"
                });

                if (response.ok) {
                    const data = await response.json();
                    setAppointments(data);
                }
            } catch (error) {
                console.error("Lỗi kết nối đến Backend:", error);
            }
        };

        fetchAppointments();
    }, []);

    const filteredAppointments = appointments.filter((a) =>
        a.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.roomName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case "Confirmed":
                return <Badge bg="success">Đã xác nhận</Badge>;
            case "Booked":
                return <Badge bg="primary">Đã đặt</Badge>;
            case "Completed":
                return <Badge bg="info">Đã hoàn thành</Badge>;
            case "Cancelled":
                return <Badge bg="danger">Đã hủy</Badge>;
            case "No Show":
                return <Badge bg="secondary">Không đến</Badge>;
            default:
                return <Badge bg="dark">{status}</Badge>;
        }
    };

    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="mb-4 fw-bold text-uppercase" style={{ color: "#2c3e50" }}>
                Danh sách lịch hẹn
            </h2>

            {/* KHU VỰC TÌM KIẾM & NÚT TẠO LỊCH HẸN NẰM NGANG NHAU */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <InputGroup className="w-50 shadow-sm">
                    <InputGroup.Text className="bg-white">
                        <i className="bi bi-search text-muted"></i>
                    </InputGroup.Text>
                    <Form.Control
                        placeholder="Tìm theo khách hàng, nhân viên, dịch vụ, phòng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-start-0 ps-0"
                    />
                </InputGroup>

                {/* CHỈ HIỂN THỊ NÚT NÀY CHO LỄ TÂN VÀ QUẢN LÝ */}
                {isManagerOrReceptionist && (
                    <Button
                        className="fw-bold text-white shadow-sm px-4 py-2"
                        style={{ backgroundColor: "#800020", border: "none" }}
                        onClick={() => navigate("/appointments/create")}
                    >
                        <i className="bi bi-calendar-plus me-2"></i> Tạo lịch hẹn
                    </Button>
                )}
            </div>

            {/* BẢNG DANH SÁCH LỊCH HẸN (GIAO DIỆN MỚI CÓ MÀU ĐỎ ĐÔ) */}
            <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead style={{ backgroundColor: "#800020", color: "#ffffff" }}>
                                <tr>
                                    <th className="ps-3 py-3">Appointment ID</th>
                                    <th className="py-3">Ngày</th>
                                    <th className="py-3">Thời gian</th>
                                    <th className="py-3">Khách hàng</th>
                                    <th className="py-3">Dịch vụ</th>
                                    <th className="py-3">Nhân viên</th>
                                    <th className="py-3">Phòng</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="text-center pe-3 py-3">Hành động</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((a) => (
                                        <tr key={a.appointmentId}>
                                            <td className="ps-3 fw-bold">{a.appointmentId}</td>
                                            <td className="fw-semibold">{a.appointmentDate}</td>
                                            <td>{a.startTime} - {a.endTime}</td>
                                            <td className="fw-bold text-dark">{a.customerName}</td>
                                            <td>{a.serviceName}</td>
                                            <td>{a.staffName}</td>
                                            <td>{a.roomName}</td>
                                            <td>{getStatusBadge(a.status)}</td>
                                            <td className="text-center pe-3">
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="fw-bold"
                                                    style={{ backgroundColor: "#800020", border: "none" }}
                                                    onClick={() =>
                                                        navigate(`/appointments/${a.appointmentId}`)
                                                    }
                                                >
                                                    <i className="bi bi-eye-fill me-1"></i> Xem
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="text-center text-muted py-4"
                                        >
                                            Không tìm thấy lịch hẹn nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AppointmentList;