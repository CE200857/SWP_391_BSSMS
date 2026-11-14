import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Table,
    Button
} from "react-bootstrap";
import treatmentPhoto from "../../../assets/figma/service-card-exact-02.png";
import massagePhoto from "../../../assets/figma/service-card-exact-03.png";
import { useManagerSearchFilter } from "../../../components/ManagerSearchFilter";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge";
import { setAppointmentStatus } from "../../../utils/appointmentActions";

const AppointmentList = ({ user, setUser }) => {
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeFilter, setTimeFilter] = useState("all");
    const [loadError, setLoadError] = useState("");
    const navigate = useNavigate();

    const isManagerOrReceptionist = user?.role === "Manager" || user?.role === "Receptionist";
    const { filteredRows: managerFilteredAppointments, toolbar } = useManagerSearchFilter(
        appointments,
        [
            { key: "appointmentId", label: "Mã lịch hẹn", filterable: false },
            { key: "customerName", label: "Khách hàng" },
            { key: "customerPhone", label: "Số điện thoại", filterable: false },
            { key: "technicianNames", label: "Kỹ thuật viên" },
            { key: "serviceNames", label: "Dịch vụ", filterable: false },
            { key: "invoiceStatus", label: "Hóa đơn" },
            { key: "status", label: "Trạng thái" },
            { key: "appointmentDate", label: "Ngày hẹn", type: "date" },
        ],
        "Tìm theo khách hàng, nhân viên, dịch vụ, phòng...",
    );

    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const [approvingId, setApprovingId] = useState(null);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const fetchAppointments = async () => {
            setLoading(true);
            setLoadError("");
            setSessionExpired(false);
            try {
                const response = await fetch("/api/appointments", {
                    credentials: "include",
                    signal: controller.signal,
                });
                if (response.status === 401) {
                    setSessionExpired(true);
                    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                }
                if (response.status === 403) throw new Error("Bạn không có quyền xem danh sách lịch hẹn.");
                if (response.status === 404) throw new Error("Không tìm thấy API lịch hẹn (HTTP 404). Vui lòng kiểm tra bản back-end đang chạy.");
                if (!response.ok) throw new Error(`Máy chủ không tải được lịch hẹn (HTTP ${response.status}). Vui lòng thử lại hoặc kiểm tra log back-end.`);
                const type = response.headers.get("content-type") || "";
                if (!type.includes("application/json")) throw new Error("API lịch hẹn trả về dữ liệu không đúng định dạng. Vui lòng kiểm tra đường dẫn back-end.");
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error("Dữ liệu lịch hẹn không đúng định dạng danh sách.");
                if (!controller.signal.aborted) setAppointments(data);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setAppointments([]);
                    setLoadError(error instanceof TypeError
                        ? "Không kết nối được tới máy chủ. Vui lòng kiểm tra back-end đã chạy và thử lại."
                        : error.message);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };
        fetchAppointments();
        return () => controller.abort();
    }, [attempt, user?.accountId]);

    const loginAgain = () => {
        localStorage.removeItem("user");
        setUser(null);
        navigate(user?.role === "Customer" ? "/login" : "/dashboard/login", {
            replace: true, state: { from: "/appointments" },
        });
    };
    const errorPanel = loadError && (
        <div className="alert alert-danger" role="alert">
            <p>{loadError}</p>
            <Button onClick={sessionExpired ? loginAgain : () => setAttempt(value => value + 1)}>
                {sessionExpired ? "Đăng nhập lại" : "Thử lại"}
            </Button>
        </div>
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filteredCustomerAppointments = appointments.filter((appointment) => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch = !query ||
            appointment.customerName?.toLowerCase().includes(query) ||
            appointment.technicianNames?.toLowerCase().includes(query) ||
            appointment.serviceNames?.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
        const dateValue = String(appointment.appointmentDate || "").slice(0, 10);
        const date = new Date(`${dateValue}T00:00:00`);
        const isPast = !Number.isNaN(date.getTime()) && date < today;
        const matchesTime = timeFilter === "all" ||
            (timeFilter === "upcoming" && !isPast) ||
            (timeFilter === "past" && isPast);
        return matchesSearch && matchesStatus && matchesTime;
    });
    const filteredAppointments = [...(user?.role === "Customer"
        ? filteredCustomerAppointments
        : managerFilteredAppointments)].sort((a, b) => Number(b.appointmentId) - Number(a.appointmentId));

    const formatAppointmentDate = (value) => {
        const dateValue = String(value || "").slice(0, 10);
        const date = new Date(`${dateValue}T00:00:00`);
        return Number.isNaN(date.getTime())
            ? value
            : new Intl.DateTimeFormat("vi-VN").format(date);
    };

    const approve = async (appointmentId) => {
        setApprovingId(appointmentId);
        try {
            await setAppointmentStatus(appointmentId, "Confirmed");
            setAttempt((value) => value + 1);
        } catch (error) {
            alert(error.message);
        } finally {
            setApprovingId(null);
        }
    };

    const markNoShow = async (appointmentId) => {
        if (!window.confirm(`Đánh dấu lịch #${appointmentId} là khách không đến? Hóa đơn chưa thanh toán sẽ bị hủy.`)) return;
        setApprovingId(appointmentId);
        try {
            await setAppointmentStatus(appointmentId, "No-show");
            setAttempt((value) => value + 1);
        } catch (error) {
            alert(error.message);
        } finally {
            setApprovingId(null);
        }
    };

    const getStatusBadge = (status) => <AppointmentStatusBadge status={status} />;

    if (user?.role === "Customer") {
        const completedCount = appointments.filter(appointment => appointment.status === "Completed").length;

        return (
            <div className="customer-appointments-page">
                <section className="customer-page-banner">
                    <div className="customer-page-container">
                        <div className="customer-breadcrumb">
                            <span>Trang chủ</span><i className="bi bi-chevron-right" aria-hidden="true" />
                            <strong>Danh sách lịch hẹn</strong>
                        </div>
                        <div className="customer-banner-content">
                            <div>
                                <span className="seoul-eyebrow">HÀNH TRÌNH CHĂM SÓC CỦA BẠN</span>
                                <h1>Danh sách lịch hẹn</h1>
                                <p>Nhìn lại những buổi chăm sóc bạn đã trải nghiệm tại Seoul Center.<br />Mỗi lịch hẹn, một khoảng khắc dành riêng cho chính mình.</p>
                            </div>
                            <div className="customer-summary-card">
                                <span><i className="bi bi-calendar2-check" aria-hidden="true" /> Lịch hẹn trong danh sách</span>
                                <strong>{String(completedCount).padStart(2, "0")}</strong>
                                <small>đã hoàn thành</small>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="customer-page-container customer-appointments-content">
                    <div className="customer-filter-panel">
                        <div className="customer-filter-title">
                            <strong><i className="bi bi-sliders" aria-hidden="true" /> Tìm lại buổi chăm sóc của bạn</strong>
                            <span>Đang hiển thị {filteredAppointments.length} lịch hẹn</span>
                        </div>
                        <label className="customer-filter-search">
                            <span>Dịch vụ, nhân viên hoặc phòng</span>
                            <div>
                                <i className="bi bi-search" aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Tìm dịch vụ, nhân viên hoặc phòng..."
                                    value={searchTerm}
                                    onChange={event => setSearchTerm(event.target.value)}
                                />
                            </div>
                        </label>
                        <label>
                            <span>Trạng thái</span>
                            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                                <option value="all">Tất cả trạng thái</option>
                                <option value="Pending">Chờ xác nhận</option>
                                <option value="Confirmed">Đã xác nhận</option>
<option value="Checked-in">Đã check-in</option>
                                <option value="In-progress">Đang thực hiện</option>
                                <option value="Completed">Đã hoàn thành</option>
                                <option value="Cancelled">Đã hủy</option>
                                <option value="No-show">Không đến</option>
                            </select>
                        </label>
                        <label>
                            <span>Thời gian</span>
                            <select value={timeFilter} onChange={event => setTimeFilter(event.target.value)}>
                                <option value="all">Tất cả thời gian</option>
                                <option value="upcoming">Sắp tới</option>
                                <option value="past">Đã qua</option>
                            </select>
                        </label>
                    </div>

                    <div className="customer-appointment-heading">
                        <h2>Những buổi chăm sóc của bạn</h2>
                        <span>{filteredAppointments.length} lịch hẹn</span>
                    </div>

                    {loading ? <p role="status">Đang tải lịch hẹn...</p> : loadError ? errorPanel : filteredAppointments.length === 0 ? (
                        <div className="customer-empty-state">
                            <i className="bi bi-calendar2-heart" aria-hidden="true" />
                            <strong>{appointments.length === 0 ? "Bạn chưa có lịch hẹn nào" : "Không tìm thấy lịch hẹn phù hợp"}</strong>
                            <span>Khám phá dịch vụ và chọn thời gian phù hợp với bạn.</span>
                            <Button variant="primary" onClick={() => navigate("/guest/services")}>Khám phá dịch vụ</Button>
                        </div>
                    ) : (
                        <div className="customer-appointment-list">
                            {filteredAppointments.map((appointment, index) => (
                                <article className="customer-appointment-card" key={appointment.appointmentId}>
                                    <img src={index % 2 === 0 ? treatmentPhoto : massagePhoto} alt="" loading="lazy" decoding="async" onLoad={(event) => event.currentTarget.classList.add("is-loaded")} onError={(event) => event.currentTarget.classList.add("is-loaded")} />
                                    <div className="customer-appointment-card-content">
                                        <div className="customer-appointment-card-top">
                                            <span>Mã lịch hẹn: {appointment.appointmentId}</span>
                                            {getStatusBadge(appointment.status)}
                                        </div>
                                        <h3>{appointment.serviceNames}</h3>
                                        <div className="customer-appointment-meta">
                                            <span><i className="bi bi-clock" aria-hidden="true" /><small>Giờ hẹn</small>{String(appointment.startTime || "").slice(0, 5)}–{String(appointment.endTime || "").slice(0, 5)}</span>
                                            <span><i className="bi bi-person" aria-hidden="true" /><small>Kỹ thuật viên</small>{appointment.technicianNames || "Phân công khi check-in"}</span>
                                            <span><i className="bi bi-receipt" aria-hidden="true" /><small>Thanh toán</small>{appointment.invoiceStatus === "Paid" ? "Đã thanh toán" : appointment.paymentChoice === "Online" ? "VNPay" : "Tại quầy"}</span>
                                        </div>
                                        <div className="customer-appointment-card-bottom">
                                            <span>Ngày hẹn: {formatAppointmentDate(appointment.appointmentDate)}</span>
                                            <Button variant="link" onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}>
                                                Xem chi tiết <i className="bi bi-arrow-up-right" aria-hidden="true" />
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    <div className="customer-page-footnote">
                        <span>Bạn đã xem tất cả lịch hẹn trong danh sách.</span>
                        <span>Hình ảnh dịch vụ mang tính minh họa.</span>
                    </div>
                </section>
            </div>
        );
    }

    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="manager-page-title mb-4 fw-bold">
                Danh sách lịch hẹn
            </h2>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="manager-list-toolbar">{toolbar}</div>

                {user?.role === "Receptionist" && (
                    <Button
                        className="fw-bold text-white shadow-sm px-4 py-2"
                        style={{ backgroundColor: "#800020", border: "none" }}
                        onClick={() => navigate("/appointments/create")}
                    >
                        <i className="bi bi-calendar-plus me-2"></i> Tạo lịch hẹn
                    </Button>
                )}
            </div>

            {errorPanel}
            {loading && <p role="status">Đang tải lịch hẹn...</p>}

            <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0 manager-list-table">
                            <thead style={{ backgroundColor: "#800020", color: "#ffffff" }}>
                                <tr>
                                    <th className="ps-3 py-3">Mã</th>
                                    <th className="py-3">Ngày & giờ</th>
                                    <th className="py-3">Khách hàng</th>
                                    <th className="py-3">Dịch vụ</th>
                                    <th className="py-3">Trạng thái</th>
                                    <th className="text-center pe-3 py-3">Hành động</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((a) => (
                                        <tr key={a.appointmentId}>
                                            <td className="ps-3 fw-bold">#{a.appointmentId}</td>
                                            <td>
                                                <div className="fw-semibold">{formatAppointmentDate(a.appointmentDate)}</div>
                                                <small className="text-muted">{String(a.startTime || "").slice(0, 5)}–{String(a.endTime || "").slice(0, 5)}</small>
                                            </td>
                                            <td className="fw-bold text-dark">{a.customerName}<small className="d-block text-muted fw-normal">{a.customerPhone}</small></td>
                                            <td>
                                                <div>{a.serviceNames}</div>
                                                <small className="text-muted">{a.technicianNames || "Chưa phân công KTV"}</small>
                                            </td>
                                            <td>
                                                {getStatusBadge(a.status)}
                                                {a.timingNote && <small className={`d-block mt-1 ${/Quá hạn|Trễ/.test(a.timingNote) ? "text-danger fw-semibold" : "text-muted"}`}>{a.timingNote}</small>}
                                            </td>
                                            <td className="text-center pe-3">
                                                <div className="manager-list-actions">
                                                {user?.role === "Receptionist" && a.status === "Pending" && a.canConfirm !== false && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="manager-list-action manager-list-action--edit"
                                                        disabled={approvingId === a.appointmentId}
                                                        onClick={() => approve(a.appointmentId)}
                                                    >
                                                        <i className="bi bi-check2-circle me-1"></i> Duyệt
                                                    </Button>
                                                )}
                                                {user?.role === "Receptionist" && a.canCheckIn === true && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="manager-list-action manager-list-action--edit"
                                                        onClick={() => navigate(`/receptionist/coordination?appointmentId=${a.appointmentId}`)}
                                                    >
                                                        <i className="bi bi-door-open me-1"></i> Check-in
                                                    </Button>
                                                )}
                                                {user?.role === "Receptionist" && a.canNoShow === true && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="manager-list-action manager-list-action--delete"
                                                        disabled={approvingId === a.appointmentId}
                                                        onClick={() => markNoShow(a.appointmentId)}
                                                    >
                                                        <i className="bi bi-person-x me-1"></i> Không đến
                                                    </Button>
                                                )}
                                                <Button
                                                variant="link"
                                                size="sm"
                                                className="manager-list-action manager-list-action--view"
                                                onClick={() =>
                                                    navigate(`/appointments/${a.appointmentId}`)
                                                }
                                                >
                                                    <i className="bi bi-eye-fill me-1"></i> Xem
                                                </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center text-muted py-4"
                                        >
                                            {loading ? "Đang tải lịch hẹn..." : loadError ? "Chưa tải được dữ liệu lịch hẹn." : "Không tìm thấy lịch hẹn nào."}
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