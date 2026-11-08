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
import "./UpdateRoomBedStatus.css";

// Nhãn tình trạng sử dụng phòng, giường (Iter1)
const USE_STATE_LABELS = { Available: "Sẵn sàng", InUse: "Đang dùng", NeedsCleaning: "Cần dọn" };

const UpdateRoomBedStatus = ({ user: routeUser }) => {
    const [rooms, setRooms] = useState([]);
    const [beds, setBeds] = useState([]);
    const [equipment, setEquipment] = useState([]);
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
    const isTechnician = user?.role === "Technician";

    async function fetchData() {
        setIsLoading(true);
        setLoadError("");
        try {
            const response = await fetch("/api/room-bed-status");

            if (response.ok) {
                const data = await response.json();

                if (Array.isArray(data)) {
                    setRooms(data);
                    setEquipment([]);
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
                } else if (data && Array.isArray(data.rooms) && Array.isArray(data.beds)) {
                    setRooms(data.rooms);
                    setBeds(data.beds);
                    setEquipment(Array.isArray(data.equipment) ? data.equipment : []);
                } else {
                    setLoadError("Dữ liệu phòng, giường hoặc thiết bị trả về không hợp lệ.");
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


    const updateResourceStatus = async (type, id, status, field) => {
        const endpoint = `/api/room-bed-status/${type}/${id}`;
        const response = await fetch(endpoint, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(field ? { status, field } : { status }),
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

    // Kỹ thuật viên cập nhật tình trạng sử dụng của phòng hoặc giường: Sẵn sàng / Đang dùng / Cần dọn (Iter1, UC-47)
    const handleUpdateUseState = async (type, item) => {
        if (!canUpdate) return;
        const id = type === "room" ? item.roomId : item.bedId;
        const current = item.useState || "Available";
        const next = document.getElementById(`${type}-use-select-${id}`)?.value || current;

        if (next === current) {
            setUpdateError("Vui lòng chọn tình trạng khác trước khi lưu.");
            return;
        }

        setUpdatingId(id);
        setUpdatingType(type);
        setSuccessMsg("");
        setUpdateError("");

        try {
            await updateResourceStatus(type, id, next, "useState");
            const target = type === "room" ? `phòng "${item.roomName}"` : `giường "${item.bedNumber}"`;
            setSuccessMsg(`Đã cập nhật ${target}: ${USE_STATE_LABELS[next]}.`);
            const patch = (r) => ({
                ...r,
                useState: next,
                usageStatus:
                    r.status === "Maintenance"
                        ? "Maintenance"
                        : next === "NeedsCleaning"
                            ? "NeedsCleaning"
                            : next === "InUse" || r.currentAppointmentStatus === "In-progress"
                                ? "InUse"
                                : r.currentAppointmentStatus === "Checked-in"
                                    ? "CheckedIn"
                                    : "Available",
            });
            if (type === "room") setRooms((prev) => prev.map((r) => (r.roomId === id ? patch(r) : r)));
            else setBeds((prev) => prev.map((b) => (b.bedId === id ? patch(b) : b)));
        } catch (err) {
            console.error("Lỗi cập nhật tình trạng sử dụng:", err);
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
    const getRoomBedConditionStatus = (resource) => {
        const status = resource.usageStatus;
        if (["InUse", "NeedsCleaning", "CheckedIn", "Available", "Maintenance"].includes(status)) {
            return status;
        }
        if (resource.status === "Maintenance") return "Maintenance";
        return resource.currentAppointmentId || resource.currentCustomerName ? "CheckedIn" : "Available";
    };
    const getRoomBedConditionBadge = (resource) => {
        const status = getRoomBedConditionStatus(resource);
        const statusMap = {
            CheckedIn: { bg: "warning", text: "Đã nhận khách" },
            InUse: { bg: "primary", text: "Đang dùng" },
            NeedsCleaning: { bg: "secondary", text: "Cần dọn" },
            Available: { bg: "info", text: "Đang trống" },
            Maintenance: { bg: "danger", text: "Bảo trì" },
        };
        const style = statusMap[status] || { bg: "secondary", text: "Chưa rõ" };
        return <Badge bg={style.bg}>{style.text}</Badge>;
    };
    const getEquipmentConditionBadge = (item) => {
        return getRoomBedConditionBadge(item);
    };
    const matchesRoomBedCondition = (resource) => {
        const usageStatus = getRoomBedConditionStatus(resource);
        return statusFilter === "all" ||
            (statusFilter === "CheckedIn" && usageStatus === "CheckedIn") ||
            usageStatus === statusFilter;
    };

    const filteredRooms = rooms.filter((r) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            r.roomName?.toLowerCase().includes(search) ||
            r.roomType?.toLowerCase().includes(search);
        const matchesStatus = r.status === statusFilter || matchesRoomBedCondition(r);
        return matchesSearch && matchesStatus;
    });

    const filteredBeds = beds.filter((b) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            b.bedNumber?.toLowerCase().includes(search) ||
            b.roomName?.toLowerCase().includes(search);
        const matchesStatus = b.status === statusFilter || matchesRoomBedCondition(b);
        return matchesSearch && matchesStatus;
    });
    const filteredEquipment = equipment.filter((item) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            item.equipmentName?.toLowerCase().includes(search) ||
            item.roomName?.toLowerCase().includes(search);
        const matchesStatus =
            statusFilter === "all" ||
            item.status === statusFilter ||
            item.usageStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!canUpdate) {
        return (
            <Container className="mt-4 px-4">
                <Alert variant="warning">
                    Bạn không có quyền truy cập trang này. Chỉ Quản lý, Lễ tân hoặc Kỹ thuật viên mới có thể xem tình trạng vận hành phòng/giường.
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
            <div className="ui-page-heading">
                <div>
                    <h1>Trạng thái phòng & giường</h1>
                    <p>Chuyển phòng, giường sang bảo trì hoặc đưa vào hoạt động trở lại. Phòng đang hoạt động vẫn có thể đã được đặt theo khung giờ.</p>
                </div>
                <Button variant="outline-primary" onClick={fetchData} disabled={isLoading}>
                    <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
                    Làm mới
                </Button>
            </div>

            {successMsg && <Alert variant="success">{successMsg}</Alert>}
            {loadError && <Alert variant="danger">{loadError}</Alert>}
            {updateError && <Alert variant="danger" role="alert">{updateError}</Alert>}

            {/* Bộ lọc */}
            <Card className="room-bed-filter-card mb-4">
                <Card.Body>
                    <div className="room-bed-toolbar">
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
                            <option value="CheckedIn">Đã nhận khách</option>
                            <option value="InUse">Đang dùng</option>
                            <option value="NeedsCleaning">Cần dọn</option>
                            <option value="Available">Đang trống</option>
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            <Row className="g-4">
                {/* Bảng phòng */}
                <Col xs={12}>
                    <Card className="room-bed-list-card h-100">
                        <Card.Header className="room-bed-list-card-header">
                            <span>
                                <i className="bi bi-door-open me-2"></i>Danh sách phòng
                            </span>
                            <Badge bg="light" text="dark">{filteredRooms.length} / {rooms.length}</Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="align-middle mb-0 manager-list-table room-bed-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên phòng</th>
                                        <th>Loại phòng</th>
                                        <th>Hoạt động</th>
                                        <th>Tình trạng</th>
                                        {isTechnician && <th className="text-center">Cập nhật</th>}
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
                                                    {getRoomBedConditionBadge(r)}
                                                    {r.currentCustomerName && (
                                                        <div className="small text-muted mt-1">
                                                            {r.currentCustomerName} · {r.currentServiceName}
                                                        </div>
                                                    )}
                                                </td>
                                                {isTechnician && (
                                                <td>
                                                    {Number(r.technicianCanUpdate) === 1 && r.status !== "Maintenance" ? <div className="room-bed-row-actions">
                                                        <Form.Select
                                                            id={`room-use-select-${r.roomId}`}
                                                            size="sm"
                                                            defaultValue={r.useState || "Available"}
                                                            disabled={updatingId === r.roomId}
                                                            aria-label={`Tình trạng sử dụng phòng ${r.roomName}`}
                                                        >
                                                            <option value="Available">Sẵn sàng</option>
                                                            <option value="InUse">Đang dùng</option>
                                                            <option value="NeedsCleaning">Cần dọn</option>
                                                        </Form.Select>
                                                        <Button
                                                            variant="primary"
                                                            className="room-bed-save-button"
                                                            size="sm"
                                                            aria-label={`Lưu tình trạng sử dụng phòng ${r.roomName}`}
                                                            onClick={() => handleUpdateUseState("room", r)}
                                                            disabled={updatingId === r.roomId}
                                                        >
                                                            {updatingId === r.roomId && updatingType === "room" ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <i className="bi bi-check2"></i>
                                                            )}
                                                        </Button>
                                                    </div> : <span className="small text-muted">Chỉ xem</span>}
                                                </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isTechnician ? 6 : 5} className="text-center text-muted py-4">
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
                <Col xs={12}>
                    <Card className="room-bed-list-card h-100">
                        <Card.Header className="room-bed-list-card-header">
                            <span>
                                <i className="bi bi-lamp me-2"></i>Danh sách giường
                            </span>
                            <Badge bg="light" text="dark">{filteredBeds.length} / {beds.length}</Badge>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="align-middle mb-0 manager-list-table room-bed-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Số giường</th>
                                        <th>Phòng</th>
                                        <th>Hoạt động</th>
                                        <th>Tình trạng</th>
                                        {isTechnician && <th className="text-center">Cập nhật</th>}
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
                                                    {getRoomBedConditionBadge(b)}
                                                    {b.currentCustomerName && (
                                                        <div className="small text-muted mt-1">
                                                            {b.currentCustomerName} · {b.currentServiceName}
                                                        </div>
                                                    )}
                                                </td>
                                                {isTechnician && (
                                                <td>
                                                    {Number(b.technicianCanUpdate) === 1 && b.status !== "Maintenance" && b.usageStatus !== "Maintenance" ? <div className="room-bed-row-actions">
                                                        <Form.Select
                                                            id={`bed-use-select-${b.bedId}`}
                                                            size="sm"
                                                            defaultValue={b.useState || "Available"}
                                                            disabled={updatingId === b.bedId}
                                                            aria-label={`Tình trạng sử dụng giường ${b.bedNumber}`}
                                                        >
                                                            <option value="Available">Sẵn sàng</option>
                                                            <option value="InUse">Đang dùng</option>
                                                            <option value="NeedsCleaning">Cần dọn</option>
                                                        </Form.Select>
                                                        <Button
                                                            variant="primary"
                                                            className="room-bed-save-button"
                                                            size="sm"
                                                            aria-label={`Lưu tình trạng sử dụng giường ${b.bedNumber}`}
                                                            onClick={() => handleUpdateUseState("bed", b)}
                                                            disabled={updatingId === b.bedId}
                                                        >
                                                            {updatingId === b.bedId && updatingType === "bed" ? (
                                                                <Spinner size="sm" />
                                                            ) : (
                                                                <i className="bi bi-check2"></i>
                                                            )}
                                                        </Button>
                                                    </div> : <span className="small text-muted">Chỉ xem</span>}
                                                </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isTechnician ? 6 : 5} className="text-center text-muted py-4">
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
            <Card className="room-bed-list-card mt-4">
                <Card.Header className="room-bed-list-card-header">
                    <span><i className="bi bi-tools me-2" aria-hidden="true"></i>Thiết bị & vị trí sử dụng</span>
                    <Badge bg="light" text="dark">{filteredEquipment.length} / {equipment.length}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                    <Table hover responsive className="align-middle mb-0 manager-list-table room-bed-table">
                        <thead>
                            <tr>
                                <th>Thiết bị</th>
                                <th>Phòng hiện tại</th>
                                <th>Tình trạng</th>
                                <th>Đang phục vụ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEquipment.length > 0 ? filteredEquipment.map((item) => (
                                <tr key={item.equipmentId}>
                                    <td className="fw-semibold">{item.equipmentName}</td>
                                    <td>{item.roomName || "Kho / chưa phân phòng"}</td>
                                    <td>{getEquipmentConditionBadge(item)}</td>
                                    <td>
                                        {item.currentCustomerName
                                            ? `${item.currentCustomerName} · ${item.currentServiceName}`
                                            : "—"}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-4">
                                        Không tìm thấy thiết bị phù hợp.
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

export default UpdateRoomBedStatus;
