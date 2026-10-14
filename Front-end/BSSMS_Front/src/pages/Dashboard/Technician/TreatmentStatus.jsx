import { useState, useEffect } from "react";
import {
    Container,
    Card,
    Table,
    Badge,
    Form,
    InputGroup,
    Spinner,
    Alert,
} from "react-bootstrap";

const TreatmentStatus = () => {
    const [appointments, setAppointments] = useState([]);
    const [customerPackages, setCustomerPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("appointment"); // 'appointment' or 'package'
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "null");

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setLoadError("");
            try {
                const [apptRes, packageRes, serviceRes] = await Promise.all([
                    fetch("/api/appointments"),
                    fetch("/api/customer-packages"),
                    fetch("/api/service"),
                ]);

                const apptData = apptRes.ok ? await apptRes.json() : [];
                const packageData = packageRes.ok ? await packageRes.json() : [];
                const serviceData = serviceRes.ok ? await serviceRes.json() : [];

                setAppointments(Array.isArray(apptData) ? apptData : []);
                setCustomerPackages(Array.isArray(packageData) ? packageData : []);
                setServices(Array.isArray(serviceData) ? serviceData : []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
                setLoadError("Không thể tải dữ liệu. Vui lòng thử lại.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getServiceName = (serviceId) => {
        const service = services.find((s) => s.serviceId === serviceId);
        return service ? service.serviceName : `Dịch vụ #${serviceId}`;
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            "Scheduled": { bg: "primary", text: "Đã lên lịch" },
            "Confirmed": { bg: "info", text: "Đã xác nhận" },
            "In Progress": { bg: "warning", text: "Đang thực hiện" },
            "Completed": { bg: "success", text: "Hoàn thành" },
            "Cancelled": { bg: "danger", text: "Đã hủy" },
            "No Show": { bg: "secondary", text: "Không đến" },
        };
        const style = statusMap[status] || { bg: "dark", text: status };
        return <Badge bg={style.bg}>{style.text}</Badge>;
    };

    const getPackageStatusBadge = (status) => {
        const statusMap = {
            "Active": { bg: "success", text: "Đang hoạt động" },
            "Expired": { bg: "danger", text: "Đã hết hạn" },
            "Completed": { bg: "info", text: "Đã sử dụng hết" },
        };
        const style = statusMap[status] || { bg: "dark", text: status };
        return <Badge bg={style.bg}>{style.text}</Badge>;
    };

    const filteredAppointments = appointments.filter((a) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            a.customerName?.toLowerCase().includes(search) ||
            a.serviceName?.toLowerCase().includes(search) ||
            String(a.appointmentId).includes(search);
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredPackages = customerPackages.filter((pkg) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            pkg.customerName?.toLowerCase().includes(search) ||
            pkg.packageName?.toLowerCase().includes(search) ||
            String(pkg.customerPackageId).includes(search);
        return matchesSearch;
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("vi-VN");
        } catch {
            return dateStr;
        }
    };

    if (isLoading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" variant="danger" />
                <p className="mt-3 text-muted">Đang tải dữ liệu...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-4 px-4">
            <h2 className="fw-bold text-uppercase mb-4">Xem trạng thái điều trị</h2>

            {/* Bộ lọc */}
            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <InputGroup style={{ maxWidth: "320px" }}>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Tìm theo tên khách hàng, dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>

                        <Form.Select
                            style={{ maxWidth: "200px" }}
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="appointment">Lịch hẹn điều trị</option>
                            <option value="package">Gói liệu trình</option>
                        </Form.Select>

                        {typeFilter === "appointment" && (
                            <Form.Select
                                style={{ maxWidth: "180px" }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="Scheduled">Đã lên lịch</option>
                                <option value="Confirmed">Đã xác nhận</option>
                                <option value="In Progress">Đang thực hiện</option>
                                <option value="Completed">Hoàn thành</option>
                                <option value="Cancelled">Đã hủy</option>
                                <option value="No Show">Không đến</option>
                            </Form.Select>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {loadError && <Alert variant="danger">{loadError}</Alert>}

            {/* Bảng lịch hẹn điều trị */}
            {typeFilter === "appointment" && (
                <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                    <Card.Body className="p-0">
                        <Table striped bordered hover responsive className="align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Ngày</th>
                                    <th>Thời gian</th>
                                    <th>Khách hàng</th>
                                    <th>Dịch vụ</th>
                                    <th>Nhân viên</th>
                                    <th>Phòng</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length > 0 ? (
                                    filteredAppointments.map((a) => (
                                        <tr key={a.appointmentId}>
                                            <td>{a.appointmentId}</td>
                                            <td>{formatDate(a.appointmentDate)}</td>
                                            <td>{a.startTime} - {a.endTime || "—"}</td>
                                            <td>{a.customerName || "—"}</td>
                                            <td>{a.serviceName || getServiceName(a.serviceId)}</td>
                                            <td>{a.staffName || "—"}</td>
                                            <td>{a.roomName || "—"}</td>
                                            <td>{getStatusBadge(a.status)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            Không tìm thấy lịch hẹn nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}

            {/* Bảng gói liệu trình */}
            {typeFilter === "package" && (
                <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                    <Card.Body className="p-0">
                        <Table striped bordered hover responsive className="align-middle mb-0">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Khách hàng</th>
                                    <th>Gói liệu trình</th>
                                    <th>Ngày mua</th>
                                    <th>Buổi còn lại</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPackages.length > 0 ? (
                                    filteredPackages.map((pkg) => (
                                        <tr key={pkg.customerPackageId}>
                                            <td>{pkg.customerPackageId}</td>
                                            <td>{pkg.customerName || "—"}</td>
                                            <td>{pkg.packageName || pkg.treatmentPackageName || "—"}</td>
                                            <td>{formatDate(pkg.purchaseDate)}</td>
                                            <td>
                                                <Badge bg="primary">
                                                    {pkg.remainingSessions || 0} / {pkg.numberOfSessions || 0}
                                                </Badge>
                                            </td>
                                            <td>{formatDate(pkg.expiryDate)}</td>
                                            <td>{getPackageStatusBadge(pkg.status)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-4">
                                            Không tìm thấy gói liệu trình nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default TreatmentStatus;
