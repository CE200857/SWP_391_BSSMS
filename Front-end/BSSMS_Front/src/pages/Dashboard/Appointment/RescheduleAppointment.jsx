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

const addMinutesToTime = (time, duration) => {
    if (!time || !Number.isFinite(Number(duration)) || Number(duration) <= 0) {
        return "";
    }

    const [hours, minutes] = time.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return "";

    const totalMinutes = (hours * 60 + minutes + Number(duration)) % (24 * 60);
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
};

const getStartTimeOptions = (duration, currentTime) => {
    const serviceDuration = Number(duration);
    if (!Number.isFinite(serviceDuration) || serviceDuration <= 0) return [];

    const options = [];
    for (let minutes = 8 * 60 + 30; minutes + serviceDuration <= 18 * 60 + 30; minutes += 30) {
        options.push({
            value: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
            isCurrent: false,
        });
    }

    if (currentTime && !options.some((option) => option.value === currentTime)) {
        options.unshift({ value: currentTime, isCurrent: true });
    }

    return options;
};

const getAppointmentDuration = (appointment) => {
    const serviceDuration = Number(appointment.duration);
    if (Number.isFinite(serviceDuration) && serviceDuration > 0) {
        return serviceDuration;
    }

    const start = appointment.startTime?.slice(0, 5);
    const end = appointment.endTime?.slice(0, 5);
    if (!start || !end) return 0;

    const toMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return Number.isInteger(hours) && Number.isInteger(minutes)
            ? hours * 60 + minutes
            : NaN;
    };
    const duration = toMinutes(end) - toMinutes(start);
    return Number.isFinite(duration) && duration > 0 ? duration : 0;
};

const RescheduleAppointment = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [appointment, setAppointment] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState("");
    const [startTime, setStartTime] = useState("");

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
                const duration = getAppointmentDuration(data);
                if (!duration) {
                    throw new Error("Không lấy được thời lượng dịch vụ của lịch hẹn.");
                }

                setAppointment({ ...data, duration });

                setAppointmentDate(
                    formatDateForInput(data.appointmentDate)
                );

                setStartTime(
                    data.startTime
                        ? data.startTime.substring(0, 5)
                        : ""
                );

            } catch (error) {
                console.error("Lỗi khi lấy lịch hẹn:", error);
                setError(error.message || "Không thể tải thông tin lịch hẹn.");
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [id]);

    const endTime = addMinutesToTime(startTime, appointment?.duration);
    const startTimeOptions = getStartTimeOptions(appointment?.duration, startTime);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!appointmentDate || !startTime || !endTime) {
            setError("Vui lòng nhập ngày hẹn và giờ bắt đầu hợp lệ.");
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
        <Container fluid className="appointment-reschedule-page">
            <div className="appointment-reschedule-heading">
                <div>
                    <span className="appointment-reschedule-eyebrow">QUẢN LÝ LỊCH HẸN</span>
                    <h1>Đổi lịch hẹn</h1>
                    <p>Chọn ngày và khung giờ phù hợp cho buổi hẹn của bạn.</p>
                </div>

                <Button
                    variant="light"
                    className="appointment-reschedule-back"
                    onClick={() => navigate(`/appointments/${id}`)}
                    disabled={saving}
                >
                    <i className="bi bi-arrow-left" aria-hidden="true"></i>
                    Quay lại
                </Button>
            </div>

            <Card className="appointment-reschedule-card">
                <Card.Header className="appointment-reschedule-card-header">
                    <div>
                        <span>THÔNG TIN LỊCH HẸN</span>
                        <strong>#{appointment.appointmentId}</strong>
                    </div>
                    <i className="bi bi-calendar2-check" aria-hidden="true"></i>
                </Card.Header>

                <Card.Body>
                    <div className="appointment-reschedule-summary">
                        <div>
                            <span><i className="bi bi-person" aria-hidden="true"></i> Khách hàng</span>
                            <strong>{appointment.customerName}</strong>
                        </div>
                        <div>
                            <span><i className="bi bi-stars" aria-hidden="true"></i> Dịch vụ</span>
                            <strong>{appointment.serviceName}</strong>
                        </div>
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
                        <div className="appointment-reschedule-fields">
                            <Form.Group className="appointment-reschedule-field appointment-reschedule-field--date">
                                <Form.Label>Ngày hẹn</Form.Label>

                                <Form.Control
                                    type="date"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    disabled={saving || !!success}
                                />

                                <Form.Text>
                                    Ngày hiện tại của lịch hẹn được hiển thị sẵn.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="appointment-reschedule-field appointment-reschedule-field--time-range">
                                <Form.Label>
                                    Giờ hẹn
                                    <span className="appointment-reschedule-duration">
                                        {appointment.duration} phút theo dịch vụ
                                    </span>
                                </Form.Label>

                                <div className="appointment-reschedule-time-range">
                                    <Form.Select
                                        aria-label="Giờ bắt đầu"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        disabled={saving || !!success}
                                    >
                                        {startTimeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.value}{option.isCurrent ? " (giờ hiện tại)" : ""}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <i className="bi bi-arrow-right" aria-hidden="true"></i>
                                    <output className="appointment-reschedule-end-time" aria-label="Giờ kết thúc tự động">
                                        {endTime || "—"}
                                    </output>
                                </div>
                                <Form.Text>Giờ kết thúc được tự động tính theo thời lượng dịch vụ.</Form.Text>
                            </Form.Group>
                        </div>

                        {error && (
                            <Alert variant="danger">
                                {error}
                            </Alert>
                        )}

                        <div className="appointment-reschedule-actions">
                            <Button
                                variant="light"
                                className="appointment-reschedule-cancel"
                                type="button"
                                onClick={() => navigate(`/appointments/${id}`)}
                                disabled={saving || !!success}
                            >
                                Hủy
                            </Button>

                            <Button
                                variant="primary"
                                className="appointment-reschedule-submit"
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