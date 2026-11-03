import { useState, useEffect } from "react";
import {
    Container,
    Card,
    Table,
    Badge,
    Form,
    InputGroup,
    Button,
    Alert,
    Spinner,
    Row,
    Col,
} from "react-bootstrap";

const UpdateRoomBedStatus = ({ user: routeUser }) => {
    const [rooms, setRooms] = useState([]);
    const [beds, setBeds] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [updateError, setUpdateError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [updatingType, setUpdatingType] = useState(null);

    const user = routeUser || JSON.parse(localStorage.getItem("user") || "null");
    const canUpdate = ["Manager", "Receptionist", "Technician"].includes(user?.role);

    async function fetchData() {
        setIsLoading(true);
        setLoadError("");
        try {
            const response = await fetch("/api/room-bed-status");

            if (response.ok) {
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    setRooms(data);
                    const allBeds = [];
                    data.forEach((room) => {
                        if (Array.isArray(room.beds)) {
                            room.beds.forEach((bed) => {
                                allBeds.push({
                                    ...bed,
                                    roomName: room.roomName,
                                });
                            });
                        }
                    });
                    setBeds(allBeds);
                } else {
                    setLoadError("Dữ liệu trả về không hợp lệ.");
                }
            } else {
                setLoadError(`Không thể tải dữ liệu (HTTP ${response.status}).`);
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setLoadError("Không thể kết nối đến server. Vui lòng kiểm tra backend đang chạy.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        // This request owns the initial loading and error states.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
    }, []);


    const updateResourceStatus = async (type, id, status) => {
        const endpoint = `/api/room-bed-status/${type}/${id}`;
        const response = await fetch(endpoint, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        const responseText = await response.text();
        let responseData;
        try {
            responseData = responseText ? JSON.parse(responseText) : null;
        } catch {
            responseData = null;
        }

        if (!response.ok) {
            const details = responseData?.message;
            const message = response.status === 405
                ? `Backend đang chạy không chấp nhận PUT tại ${endpoint}. ${details || "Vui lòng kiểm tra phiên bản backend và endpoint đang chạy."}`
                : details || "Máy chủ không cung cấp thông tin chi tiết.";
            throw new Error(`Cập nhật thất bại (HTTP ${response.status}): ${message}`);
        }
    };

    const handleUpdateRoomStatus = async (room) => {
        if (!canUpdate) return;

        const newStatus = document.getElementById(`room-status-select-${room.roomId}`)?.value || room.status;

        if (newStatus === room.status) {
            setUpdateError("Vui lòng chọn trạng thái khác trước khi lưu.");
            return;
        }

        setUpdatingId(room.roomId);
        setUpdatingType("room");
        setSuccessMsg("");
        setUpdateError("");

        try {
            await updateResourceStatus("room", room.roomId, newStatus);
            setSuccessMsg(`Cập nhật trạng thái phòng "${room.roomName}" thành công!`);
            setRooms((prev) =>
                prev.map((r) =>
                    r.roomId === room.roomId ? { ...r, status: newStatus } : r
                )
            );
        } catch (err) {
            console.error("Lỗi cập nhật phòng:", err);
            setUpdateError(err instanceof Error ? err.message : "Không thể kết nối đến máy chủ.");
        } finally {
            setUpdatingId(null);
            setUpdatingType(null);
        }
    };

    const handleUpdateBedStatus = async (bed) => {
        if (!canUpdate) return;

        const newStatus = document.getElementById(`bed-status-select-${bed.bedId}`)?.value || bed.status;

        if (newStatus === bed.status) {
            setUpdateError("Vui lòng chọn trạng thái khác trước khi lưu.");
            return;
        }

        setUpdatingId(bed.bedId);
        setUpdatingType("bed");
        setSuccessMsg("");
        setUpdateError("");

        try {
            await updateResourceStatus("bed", bed.bedId, newStatus);
            setSuccessMsg(`Cập nhật trạng thái giường "${bed.bedNumber}" thành công!`);
            setBeds((prev) =>
                prev.map((b) =>
                    b.bedId === bed.bedId ? { ...b, status: newStatus } : b
                )
            );
        } catch (err) {
            console.error("Lỗi cập nhật giường:", err);
            setUpdateError(err instanceof Error ? err.message : "Không thể kết nối đến máy chủ.");
        } finally {
            setUpdatingId(null);
            setUpdatingType(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            "Active": { bg: "success", text: "Đang hoạt động" },
            "Maintenance": { bg: "danger", text: "Bảo trì" },
        };
        const style = statusMap[status] || { bg: "secondary", text: status };
        return <Badge bg={style.bg}>{style.text}</Badge>;
    };

    const filteredRooms = rooms.filter((r) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            r.roomName?.toLowerCase().includes(search) ||
            r.roomType?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredBeds = beds.filter((b) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            b.bedNumber?.toLowerCase().includes(search) ||
            b.roomName?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!canUpdate) {
        return (
            <Container className="mt-4 px-4">
                <Alert variant="warning">
                    Bạn không có quyền truy cập trang này. Chỉ Quản lý, Lễ tân hoặc Kỹ thuật viên mới có thể cập nhật trạng thái phòng/giường.
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
        <Container fluid className="room-bed-page mt-4 px-4">
            <h2 className="manager-page-title fw-bold mb-4">Trạng thái vận hành phòng & giường</h2>
            <p className="text-muted">Chuyển phòng, giường sang bảo trì hoặc đưa vào hoạt động trở lại. Phòng đang hoạt động vẫn có thể đã được đặt theo khung giờ.</p>

            {successMsg && <Alert variant="success">{successMsg}</Alert>}
            {loadError && <Alert variant="danger">{loadError}</Alert>}
            {updateError && <Alert variant="danger" role="alert">{updateError}</Alert>}

            {/* Bộ lọc */}
            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <InputGroup style={{ maxWidth: "280px" }}>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>

                        <Form.Select
                            style={{ maxWidth: "160px" }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="Active">Đang hoạt động</option>
                            <option value="Maintenance">Bảo trì</option>
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            <Row className="g-4">
                {/* Bảng phòng */}
                <Col md={6}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "12px" }}>
                        <Card.Header className="bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
                            <span>
                                <i className="bi bi-door-open me-2"></i>Danh sách phòng
                            </span>
                            <Badge bg="light" text="dark">{rooms.length}</Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table striped bordered hover responsive className="align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên phòng</th>
                                        <th>Loại phòng</th>
                                        <th>Trạng thái</th>
                                        <th style={{ minWidth: "180px" }}>Đổi trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRooms.length > 0 ? (
                                        filteredRooms.map((r) => (
                                            <tr key={r.roomId}>
                                                <td>{r.roomId}</td>
                                                <td className="fw-semibold">{r.roomName}</td>
                                                <td>{r.roomType || "—"}</td>
                                                <td>{getStatusBadge(r.status)}</td>
                                                <td>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <Form.Select
                                                            id={`room-status-select-${r.roomId}`}
                                                            size="sm"
                                                            defaultValue={r.status}
                                                            disabled={updatingId === r.roomId}
                                                            style={{ maxWidth: "130px" }}
                                                        >
                                                            <option value="Active">Đang hoạt động</option>
                                                            <option value="Maintenance">Bảo trì</option>
                                                        </Form.Select>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleUpdateRoomStatus(r)}
                                                            disabled={updatingId === r.roomId}
                                                        >
                                                            {updatingId === r.roomId && updatingType === "room" ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <i className="bi bi-check2"></i>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">
                                                Không tìm thấy phòng nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Bảng giường */}
                <Col md={6}>
                    <Card className="shadow-sm border-0 h-100" style={{ borderRadius: "12px" }}>
                        <Card.Header className="bg-info text-white fw-bold d-flex justify-content-between align-items-center">
                            <span>
                                <i className="bi bi-lamp me-2"></i>Danh sách giường
                            </span>
                            <Badge bg="light" text="dark">{beds.length}</Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table striped bordered hover responsive className="align-middle mb-0">
                                <thead className="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Số giường</th>
                                        <th>Phòng</th>
                                        <th>Trạng thái</th>
                                        <th style={{ minWidth: "180px" }}>Đổi trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBeds.length > 0 ? (
                                        filteredBeds.map((b) => (
                                            <tr key={b.bedId}>
                                                <td>{b.bedId}</td>
                                                <td className="fw-semibold">{b.bedNumber}</td>
                                                <td>{b.roomName || `Phòng #${b.roomId}`}</td>
                                                <td>{getStatusBadge(b.status)}</td>
                                                <td>
                                                    <div className="d-flex gap-2 align-items-center">
                                                        <Form.Select
                                                            id={`bed-status-select-${b.bedId}`}
                                                            size="sm"
                                                            defaultValue={b.status}
                                                            disabled={updatingId === b.bedId}
                                                            style={{ maxWidth: "130px" }}
                                                        >
                                                            <option value="Active">Đang hoạt động</option>
                                                            <option value="Maintenance">Bảo trì</option>
                                                        </Form.Select>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleUpdateBedStatus(b)}
                                                            disabled={updatingId === b.bedId}
                                                        >
                                                            {updatingId === b.bedId && updatingType === "bed" ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <i className="bi bi-check2"></i>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">
                                                Không tìm thấy giường nào.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default UpdateRoomBedStatus;
