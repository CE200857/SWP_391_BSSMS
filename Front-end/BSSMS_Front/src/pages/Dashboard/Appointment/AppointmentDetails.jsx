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

    // Feedback cho appointment này (chỉ load khi status = Completed)
    const [feedback, setFeedback] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);

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

    // Khi appointment đã Completed -> gọi API lấy feedback (nếu có)
    useEffect(() => {
        if (!appointment || appointment.status !== "Completed") {
            setFeedback(null);
            return;
        }

        let cancelled = false;
        const loadFeedback = async () => {
            try {
                setFeedbackLoading(true);
                const res = await fetch(
                    `/api/feedback?appointmentId=${appointment.appointmentId}`
                );
                if (cancelled) return;
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        // Lấy feedback mới nhất của appointment này
                        if (!cancelled) setFeedback(data[0]);
                    } else if (!cancelled) {
                        setFeedback(null);
                    }
                } else if (!cancelled) {
                    setFeedback(null);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Lỗi tải feedback:", err);
                    setFeedback(null);
                }
            } finally {
                if (!cancelled) setFeedbackLoading(false);
            }
        };

        loadFeedback();

        return () => {
            cancelled = true;
        };
    }, [appointment]);

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

    // Render 5 sao theo rating (filled = vàng, còn lại = xám)
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <i
                    key={i}
                    className={`bi ${
                        i <= rating
                            ? "bi-star-fill text-warning"
                            : "bi-star text-secondary"
                    }`}
                    style={{ fontSize: "20px", marginRight: "4px" }}
                />
            );
        }
        return stars;
    };

    const formatFeedbackDate = (dateStr) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
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

            {/* ============== PHẦN ĐÁNH GIÁ - chỉ hiển thị khi Completed ============== */}
            {appointment.status === "Completed" && (
                <Card className="shadow-sm mt-4">
                    <Card.Header className="fw-bold d-flex align-items-center">
                        <i className="bi bi-chat-quote-fill me-2 text-danger"></i>
                        Đánh giá từ khách hàng
                        {feedback && (
                            <Badge bg="warning" text="dark" className="ms-2">
                                {feedback.rating} / 5
                            </Badge>
                        )}
                    </Card.Header>
                    <Card.Body>
                        {feedbackLoading ? (
                            <div className="text-center py-3">
                                <Spinner animation="border" size="sm" />
                                <span className="ms-2 text-muted">
                                    Đang tải đánh giá...
                                </span>
                            </div>
                        ) : feedback ? (
                            <div>
                                <div className="d-flex align-items-center mb-3">
                                    <div
                                        className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3"
                                        style={{
                                            width: "44px",
                                            height: "44px",
                                            fontSize: "18px",
                                            fontWeight: "bold",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {(
                                            feedback.customerName ||
                                            feedback.fullName ||
                                            "K"
                                        )
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="fw-bold">
                                            {feedback.customerName ||
                                                feedback.fullName ||
                                                "Khách hàng"}
                                        </div>
                                        <small className="text-muted">
                                            {formatFeedbackDate(
                                                feedback.createdAt
                                            )}
                                        </small>
                                    </div>
                                    <div className="ms-auto">
                                        {renderStars(feedback.rating)}
                                    </div>
                                </div>

                                <p
                                    className="mb-0 text-dark"
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                        padding: "12px 16px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "8px",
                                        borderLeft: "4px solid #dc3545",
                                    }}
                                >
                                    {feedback.comment || (
                                        <em className="text-muted">
                                            (Khách hàng không để lại bình luận)
                                        </em>
                                    )}
                                </p>
                            </div>
                        ) : (
                            <Alert variant="secondary" className="mb-0">
                                <i className="bi bi-info-circle me-2"></i>
                                Lịch hẹn này chưa có đánh giá từ khách hàng.
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
            )}

        </Container>
    );
};

export default AppointmentDetails;