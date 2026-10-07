import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Container,
    Card,
    Form,
    Button,
    Alert,
    Spinner
} from "react-bootstrap";

const RescheduleAppointment = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Convert appointment date to YYYY-MM-DD
    const formatDateForInput = (dateValue) => {
        if (!dateValue) {
            return "";
        }

        // Already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }

        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
            return "";
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const response = await fetch(`/api/appointments/${id}`);

                if (!response.ok) {
                    throw new Error("Không thể lấy thông tin lịch hẹn.");
                }

                const data = await response.json();

                setAppointment(data);

                setAppointmentDate(
                    formatDateForInput(data.appointmentDate)
                );

                setStartTime(
                    data.startTime
                        ? data.startTime.substring(0, 5)
                        : ""
                );

                setEndTime(
                    data.endTime
                        ? data.endTime.substring(0, 5)
                        : ""
                );

            } catch (error) {
                console.error("Lỗi khi lấy lịch hẹn:", error);
                setError("Không thể tải thông tin lịch hẹn.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!appointmentDate || !startTime || !endTime) {
            setError("Vui lòng nhập đầy đủ ngày và thời gian.");
            return;
        }

        if (startTime >= endTime) {
            setError("Giờ kết thúc phải sau giờ bắt đầu.");
            return;
        }

        try {
            setSaving(true);

            const response = await fetch(`/api/appointments/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    appointmentDate,
                    startTime: `${startTime}:00`,
                    endTime: `${endTime}:00`
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Không thể thay đổi lịch hẹn."
                );
            }

            // API đã cập nhật thành công
            setSaving(false);
            setSuccess("Reschedule appointment thành công.");

            // Tự động quay lại trang chi tiết
            setTimeout(() => {
                navigate(`/appointments/${id}`);
            }, 1000);

        } catch (error) {
            console.error("Lỗi reschedule:", error);
            setSaving(false);
            setError(error.message);
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

    if (error && !appointment) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    {error}
                </Alert>

                <Button
                    variant="secondary"
                    onClick={() => navigate(`/appointments/${id}`)}
                >
                    Quay lại
                </Button>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4 px-0">

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase">
                    Reschedule lịch hẹn
                </h2>

                <Button
                    variant="secondary"
                    onClick={() => navigate(`/appointments/${id}`)}
                    disabled={saving}
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

                    <div className="mb-4">
                        <strong>Khách hàng:</strong>{" "}
                        {appointment.customerName}
                    </div>

                    <div className="mb-4">
                        <strong>Dịch vụ:</strong>{" "}
                        {appointment.serviceName}
                    </div>

                    {success && (
                        <Alert variant="success">
                            <i className="bi bi-check-circle me-2"></i>
                            {success}
                            <div className="small mt-1">
                                Đang quay lại chi tiết lịch hẹn...
                            </div>
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">
                                Ngày hẹn
                            </Form.Label>

                            <Form.Control
                                type="date"
                                value={appointmentDate}
                                onChange={(e) =>
                                    setAppointmentDate(e.target.value)
                                }
                                disabled={saving || !!success}
                            />

                            <Form.Text className="text-muted">
                                Ngày hiện tại của lịch hẹn được hiển thị sẵn.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">
                                Giờ bắt đầu
                            </Form.Label>

                            <Form.Control
                                type="time"
                                value={startTime}
                                onChange={(e) =>
                                    setStartTime(e.target.value)
                                }
                                disabled={saving || !!success}
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold">
                                Giờ kết thúc
                            </Form.Label>

                            <Form.Control
                                type="time"
                                value={endTime}
                                onChange={(e) =>
                                    setEndTime(e.target.value)
                                }
                                disabled={saving || !!success}
                            />
                        </Form.Group>

                        {error && (
                            <Alert variant="danger">
                                {error}
                            </Alert>
                        )}

                        <div className="d-flex gap-2">

                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() =>
                                    navigate(`/appointments/${id}`)
                                }
                                disabled={saving || !!success}
                            >
                                Hủy
                            </Button>

                            <Button
                                variant="primary"
                                type="submit"
                                disabled={saving || !!success}
                            >
                                {saving ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            className="me-2"
                                        />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-calendar-check me-2"></i>
                                        Lưu thay đổi
                                    </>
                                )}
                            </Button>

                        </div>

                    </Form>

                </Card.Body>
            </Card>

        </Container>
    );
};

export default RescheduleAppointment;