import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Container,
    Card,
    Badge,
    Button,
    Spinner,
    Alert
} from "react-bootstrap";

const AppointmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const response = await fetch(`/api/appointments/${id}`);

                if (!response.ok) {
                    throw new Error("Không thể lấy thông tin lịch hẹn.");
                }

                const data = await response.json();

                setAppointment(data);
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết lịch hẹn:", error);
                setError("Không thể tải thông tin lịch hẹn.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [id]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "Confirmed":
                return <Badge bg="success">Confirmed</Badge>;

            case "Booked":
                return <Badge bg="primary">Booked</Badge>;

            case "Completed":
                return <Badge bg="info">Completed</Badge>;

            case "Cancelled":
                return <Badge bg="danger">Cancelled</Badge>;

            case "No Show":
                return (
                    <Badge bg="warning" text="dark">
                        No Show
                    </Badge>
                );

            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const handleCancel = async () => {
        const confirmed = window.confirm(
            "Bạn có chắc chắn muốn hủy lịch hẹn này không?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setCancelling(true);
            setCancelError("");

            const response = await fetch(
                `/api/appointments/${id}/cancel`,
                {
                    method: "PUT"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Không thể hủy lịch hẹn."
                );
            }

            setAppointment((prev) => ({
                ...prev,
                status: "Cancelled"
            }));

        } catch (error) {
            console.error("Lỗi cancel appointment:", error);
            setCancelError(error.message);
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" />
                <p className="mt-2">
                    Đang tải thông tin lịch hẹn...
                </p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    {error}
                </Alert>

                <Button
                    variant="secondary"
                    onClick={() => navigate("/appointments")}
                >
                    Quay lại danh sách
                </Button>
            </Container>
        );
    }

    if (!appointment) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">
                    Không tìm thấy lịch hẹn.
                </Alert>

                <Button
                    variant="secondary"
                    onClick={() => navigate("/appointments")}
                >
                    Quay lại danh sách
                </Button>
            </Container>
        );
    }

    const canModify =
        appointment.status === "Booked" ||
        appointment.status === "Confirmed";

    return (
        <Container className="mt-4">

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase">
                    Chi tiết lịch hẹn
                </h2>

                <Button
                    variant="secondary"
                    onClick={() => navigate("/appointments")}
                >
                    <i className="bi bi-arrow-left me-2"></i>
                    Quay lại
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Header className="fw-bold">
                    Appointment #{appointment.appointmentId}
                </Card.Header>

                <Card.Body>
                    <div className="row">

                        <div className="col-md-6 mb-4">
                            <label className="text-muted fw-bold">
                                Khách hàng
                            </label>
                            <div className="fs-5">
                                {appointment.customerName}
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="text-muted fw-bold">
                                Nhân viên
                            </label>
                            <div className="fs-5">
                                {appointment.staffName}
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="text-muted fw-bold">
                                Dịch vụ
                            </label>
                            <div className="fs-5">
                                {appointment.serviceName}
                            </div>
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="text-muted fw-bold">
                                Phòng
                            </label>
                            <div className="fs-5">
                                {appointment.roomName || "Chưa phân phòng"}
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <label className="text-muted fw-bold">
                                Ngày hẹn
                            </label>
                            <div className="fs-5">
                                {appointment.appointmentDate}
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <label className="text-muted fw-bold">
                                Giờ bắt đầu
                            </label>
                            <div className="fs-5">
                                {appointment.startTime}
                            </div>
                        </div>

                        <div className="col-md-4 mb-4">
                            <label className="text-muted fw-bold">
                                Giờ kết thúc
                            </label>
                            <div className="fs-5">
                                {appointment.endTime}
                            </div>
                        </div>

                        <div className="col-md-6">
                            <label className="text-muted fw-bold">
                                Trạng thái
                            </label>

                            <div className="mt-1">
                                {getStatusBadge(appointment.status)}
                            </div>
                        </div>

                        <div className="col-md-12 mt-4">
                            <label className="text-muted fw-bold">
                                Ghi chú
                            </label>

                            <div className="fs-5">
                                {appointment.notes || "Không có ghi chú"}
                            </div>
                        </div>

                        {cancelError && (
                            <div className="col-md-12 mt-4">
                                <Alert variant="danger">
                                    {cancelError}
                                </Alert>
                            </div>
                        )}

                        {canModify && (
                            <div className="mt-4 d-flex gap-2">

                                <Button
                                    variant="warning"
                                    onClick={() =>
                                        navigate(
                                            `/appointments/${appointment.appointmentId}/reschedule`
                                        )
                                    }
                                >
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Reschedule
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                >
                                    {cancelling ? (
                                        <>
                                            <Spinner
                                                size="sm"
                                                className="me-2"
                                            />
                                            Đang hủy...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-x-circle me-2"></i>
                                            Cancel
                                        </>
                                    )}
                                </Button>

                            </div>
                        )}

                    </div>
                </Card.Body>
            </Card>

        </Container>
    );
};

export default AppointmentDetails;