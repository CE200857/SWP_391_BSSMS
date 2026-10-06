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

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await fetch("/api/appointments");

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
        <Container className="mt-4">
            <h2 className="mb-4 fw-bold text-uppercase">
                Danh sách lịch hẹn
            </h2>

            <InputGroup className="mb-3 w-50">
                <InputGroup.Text>
                    <i className="bi bi-search"></i>
                </InputGroup.Text>

                <Form.Control
                    placeholder="Tìm theo khách hàng, nhân viên, dịch vụ, phòng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            <Table
                striped
                bordered
                hover
                responsive
                className="align-middle"
            >
                <thead className="table-dark">
                    <tr>
                        <th>Appointment ID</th>
                        <th>Ngày</th>
                        <th>Thời gian</th>
                        <th>Khách hàng</th>
                        <th>Dịch vụ</th>
                        <th>Nhân viên</th>
                        <th>Phòng</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((a) => (
                            <tr key={a.appointmentId}>
                                <td>{a.appointmentId}</td>
                                <td>{a.appointmentDate}</td>
                                <td>
                                    {a.startTime} - {a.endTime}
                                </td>
                                <td>{a.customerName}</td>
                                <td>{a.serviceName}</td>
                                <td>{a.staffName}</td>
                                <td>{a.roomName}</td>
                                <td>{getStatusBadge(a.status)}</td>
                                <td>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() =>
                                            navigate(`/appointments/${a.appointmentId}`)
                                        }
                                    >
                                        <i className="bi bi-eye-fill me-1"></i>
                                        Xem
                                    </Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan="9"
                                className="text-center text-muted"
                            >
                                Không tìm thấy lịch hẹn nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </Container>
    );
};

export default AppointmentList;