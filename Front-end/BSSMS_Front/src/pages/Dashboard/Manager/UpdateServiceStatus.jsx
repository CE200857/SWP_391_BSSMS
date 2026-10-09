import { useState, useEffect } from "react";
import { Container, Card, Table, Badge, Form, InputGroup, Button, Alert, Spinner } from "react-bootstrap";

const UpdateServiceStatus = () => {
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const isManager = user?.role === "Manager";

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const response = await fetch("/api/service");
            if (response.ok) {
                const data = await response.json();
                setServices(Array.isArray(data) ? data : []);
            } else {
                setLoadError("Không thể tải danh sách dịch vụ.");
            }
        } catch (err) {
            console.error("Lỗi tải dịch vụ:", err);
            setLoadError("Không thể tải danh sách dịch vụ.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (service) => {
        if (!isManager) return;

        // Lấy giá trị mới từ select - dùng event target
        const newStatus = document.getElementById(`status-select-${service.serviceId}`)?.value || service.status;

        if (newStatus === service.status) return; // Không có thay đổi

        setUpdatingId(service.serviceId);
        setSuccessMsg("");

        // Gửi đầy đủ thông tin service + status mới (theo pattern ServiceForm.jsx)
        const payload = {
            serviceName: service.serviceName,
            description: service.description,
            price: service.price,
            duration: service.duration,
            status: newStatus,
        };

        try {
            const response = await fetch(`/api/service?id=${service.serviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMsg(`Cập nhật trạng thái "${service.serviceName}" thành công!`);
                // Cập nhật lại danh sách
                setServices((prev) =>
                    prev.map((s) =>
                        s.serviceId === service.serviceId ? { ...s, status: newStatus } : s
                    )
                );
                setTimeout(() => setSuccessMsg(""), 3000);
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.message || "Cập nhật thất bại!");
            }
        } catch (err) {
            console.error("Lỗi cập nhật:", err);
            alert("Lỗi kết nối đến máy chủ!");
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredServices = services.filter((s) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            s.serviceName?.toLowerCase().includes(search) ||
            String(s.serviceId).includes(search);
        const matchesStatus = statusFilter === "all" || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        const statusMap = {
            "Active": { bg: "success", text: "Đang hoạt động" },
            "Inactive": { bg: "danger", text: "Ngừng hoạt động" },
            "Maintenance": { bg: "warning", text: "Bảo trì" },
        };
        const style = statusMap[status] || { bg: "secondary", text: status };
        return <Badge bg={style.bg}>{style.text}</Badge>;
    };

    if (!isManager) {
        return (
            <Container className="mt-4 px-4">
                <Alert variant="warning">
                    Bạn không có quyền truy cập trang này. Chỉ Quản lý mới có thể cập nhật trạng thái dịch vụ.
                </Alert>
            </Container>
        );
    }

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
            <h2 className="fw-bold text-uppercase mb-4">Cập nhật trạng thái dịch vụ</h2>

            {successMsg && <Alert variant="success">{successMsg}</Alert>}
            {loadError && <Alert variant="danger">{loadError}</Alert>}

            {/* Bộ lọc */}
            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <InputGroup style={{ maxWidth: "320px" }}>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Tìm theo tên hoặc ID dịch vụ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>

                        <Form.Select
                            style={{ maxWidth: "200px" }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Active">Đang hoạt động</option>
                            <option value="Inactive">Ngừng hoạt động</option>
                            <option value="Maintenance">Bảo trì</option>
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            {/* Bảng danh sách dịch vụ */}
            <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                <Card.Body className="p-0">
                    <Table striped bordered hover responsive className="align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Tên dịch vụ</th>
                                <th>Giá (VNĐ)</th>
                                <th>Thời lượng (phút)</th>
                                <th>Trạng thái hiện tại</th>
                                <th style={{ minWidth: "220px" }}>Đổi trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.length > 0 ? (
                                filteredServices.map((s) => (
                                    <tr key={s.serviceId}>
                                        <td>{s.serviceId}</td>
                                        <td className="fw-semibold">{s.serviceName}</td>
                                        <td>{Number(s.price).toLocaleString("vi-VN")}</td>
                                        <td>{s.duration}</td>
                                        <td>{getStatusBadge(s.status)}</td>
                                        <td>
                                            <div className="d-flex gap-2 align-items-center">
                                                <Form.Select
                                                    id={`status-select-${s.serviceId}`}
                                                    size="sm"
                                                    defaultValue={s.status}
                                                    disabled={updatingId === s.serviceId}
                                                    style={{ maxWidth: "160px" }}
                                                >
                                                    <option value="Active">Đang hoạt động</option>
                                                    <option value="Inactive">Ngừng hoạt động</option>
                                                    <option value="Maintenance">Bảo trì</option>
                                                </Form.Select>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleUpdateStatus(s)}
                                                    disabled={updatingId === s.serviceId}
                                                >
                                                    {updatingId === s.serviceId ? (
                                                        <Spinner size="sm" />
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-check2 me-1"></i>Lưu
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        Không tìm thấy dịch vụ nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default UpdateServiceStatus;
