import { useState, useEffect } from "react";
import { Container, Card, Table, Button, Form, Modal, Badge, Alert, Tabs, Tab } from "react-bootstrap";
import axios from "axios";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";

const ResourceManagement = ({ user: routeUser }) => {
  const [activeTab, setActiveTab] = useState("rooms");
  const [refresh, setRefresh] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Dữ liệu cho 3 danh mục
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const roomFilters = useManagerSearchFilter(
    rooms,
    [
      { key: "roomName", label: "Phòng", filterable: false },
      { key: "roomType", label: "Loại phòng" },
      { key: "status", label: "Trạng thái" },
    ],
    "Tìm theo tên phòng...",
  );
  const bedFilters = useManagerSearchFilter(
    beds,
    [
      { key: "bedNumber", label: "Mã giường", filterable: false },
      {
        key: "roomId",
        label: "Phòng",
        getValue: (bed) => rooms.find((room) => room.roomId === bed.roomId)?.roomName || `Phòng #${bed.roomId}`,
      },
      { key: "status", label: "Trạng thái" },
    ],
    "Tìm theo mã giường hoặc phòng...",
  );
  const equipmentFilters = useManagerSearchFilter(
    equipments,
    [
      { key: "equipmentName", label: "Thiết bị", filterable: false },
      {
        key: "roomName",
        label: "Phòng",
        formatValue: (value) => value || "Chưa phân phòng",
      },
      { key: "description", label: "Mô tả", filterable: false },
      { key: "status", label: "Trạng thái" },
    ],
    "Tìm theo tên thiết bị hoặc mô tả...",
  );

  // Quản lý Modal chung
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Quản lý Modal Xóa (Mới thêm)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Dữ liệu Form linh hoạt
  const [formData, setFormData] = useState({});

  const user = routeUser || JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "Manager";

  // Lấy dữ liệu khi đổi tab hoặc refresh
  useEffect(() => {
    if (!isManager) return;

    // Khai báo hàm fetch ngay bên trong useEffect
    const loadData = async () => {
      try {
        if (activeTab === "rooms") {
          const response = await axios.get("/api/rooms", { withCredentials: true });
          setRooms(response.data);
        } else if (activeTab === "beds") {
          const response = await axios.get("/api/beds", { withCredentials: true });
          setBeds(response.data);
        } else if (activeTab === "equipments") {
          const [equipmentResponse, roomResponse] = await Promise.all([
            axios.get("/api/equipment", { withCredentials: true }),
            axios.get("/api/rooms", { withCredentials: true }),
          ]);
          setEquipments(equipmentResponse.data);
          setRooms(roomResponse.data);
        }
      } catch (err) {
        console.error(`Lỗi tải dữ liệu tab ${activeTab}:`, err);
      }
    };

    // Gọi hàm thực thi
    loadData();
  }, [refresh, activeTab, isManager]);

  // --- XỬ LÝ FORM ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setErrorMsg("");
    if (activeTab === "rooms") {
      setFormData({ roomId: 0, roomName: "", roomType: "Treatment", status: "Active" });
    } else if (activeTab === "beds") {
      setFormData({ bedId: 0, roomId: rooms.length > 0 ? rooms[0].roomId : "", bedNumber: "", status: "Active" });
    } else if (activeTab === "equipments") {
      setFormData({ equipmentId: 0, equipmentName: "", description: "", roomId: null, status: "Active" });
    }
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEdit(true);
    setErrorMsg("");
    setFormData(item);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    // Xác định API endpoint theo Tab hiện tại
    let endpoint = "";
    if (activeTab === "rooms") endpoint = "/api/rooms";
    else if (activeTab === "beds") endpoint = "/api/beds";
    else if (activeTab === "equipments") endpoint = "/api/equipment";

    try {
      if (isEdit) {
        await axios.put(endpoint, formData, { withCredentials: true });
      } else {
        await axios.post(endpoint, formData, { withCredentials: true });
      }
      setShowModal(false);
      setRefresh((prev) => prev + 1);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || `Có lỗi xảy ra khi lưu ${activeTab}!`);
    }
  };

  // --- XỬ LÝ XÓA (Đã được làm mới) ---
  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    let endpoint = "";
    if (activeTab === "rooms") endpoint = `/api/rooms?id=${itemToDelete}`;
    else if (activeTab === "beds") endpoint = `/api/beds?id=${itemToDelete}`;
    else if (activeTab === "equipments") endpoint = `/api/equipment?id=${itemToDelete}`;

    try {
      await axios.delete(endpoint, { withCredentials: true });
      setRefresh((prev) => prev + 1);
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      alert(error.response?.data?.message || "Không thể xóa do tài nguyên này đang được sử dụng!");
      setShowDeleteModal(false);
    }
  };

  if (!isManager) {
    return (
      <Container className="mt-4 px-4">
        <Alert variant="danger">Trang này chỉ dành cho cấp Quản lý (Manager).</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 px-4">
      <div className="ui-page-heading">
        <h1 className="manager-page-title">Danh mục tài nguyên</h1>
        <Button variant="danger" className="fw-bold" style={{ backgroundColor: "#800020" }} onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Thêm mới
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-4 rounded-3">
        <Card.Body>
          <div className="manager-list-toolbar">
            {activeTab === "rooms" ? roomFilters.toolbar : activeTab === "beds" ? bedFilters.toolbar : equipmentFilters.toolbar}
          </div>
        </Card.Body>
      </Card>

      {/* TABS CHUYỂN ĐỔI */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-3"
      >
        <Tab eventKey="rooms" title="Phòng (Room)">
          <RoomTable 
            rooms={roomFilters.filteredRows}
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
          />
        </Tab>
        <Tab eventKey="beds" title="Giường (Bed)">
          <BedTable 
            beds={bedFilters.filteredRows}
            rooms={rooms} 
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
          />
        </Tab>
        <Tab eventKey="equipments" title="Thiết bị (Equipment)">
          <EquipmentTable 
            equipments={equipmentFilters.filteredRows}
            rooms={rooms}
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
          />
        </Tab>
      </Tabs>

      {/* MODAL THÊM / SỬA */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold text-danger">
            {isEdit ? "Cập nhật " : "Thêm "} 
            {activeTab === 'rooms' ? 'Phòng' : activeTab === 'beds' ? 'Giường' : 'Thiết bị'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
            
            {/* Form cho Phòng */}
            {activeTab === "rooms" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tên phòng *</Form.Label>
                  <Form.Control type="text" name="roomName" value={formData.roomName || ""} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Loại phòng</Form.Label>
                  <Form.Select name="roomType" value={formData.roomType || ""} onChange={handleChange}>
                    <option value="Treatment">Điều trị (Treatment)</option>
                    <option value="Relaxation">Thư giãn (Relaxation)</option>
                    <option value="Hair Wash">Gội đầu (Hair Wash)</option>
                    <option value="Massage">Massage</option>
                    <option value="Cosmetic">Phun xăm (Cosmetic)</option>
                    <option value="High-tech">Công nghệ cao (High-tech)</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}

            {/* Form cho Giường */}
            {activeTab === "beds" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Thuộc Phòng *</Form.Label>
                  <Form.Select name="roomId" value={formData.roomId || ""} onChange={handleChange} required>
                    {rooms.map(r => (
                      <option key={r.roomId} value={r.roomId}>{r.roomName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Mã / Số Giường *</Form.Label>
                  <Form.Control type="text" name="bedNumber" value={formData.bedNumber || ""} onChange={handleChange} required />
                </Form.Group>
              </>
            )}

            {/* Form cho Thiết bị */}
            {activeTab === "equipments" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Tên thiết bị *</Form.Label>
                  <Form.Control type="text" name="equipmentName" value={formData.equipmentName || ""} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Mô tả</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={formData.description || ""} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Phòng được bố trí</Form.Label>
                  <Form.Select
                    name="roomId"
                    value={formData.roomId || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      roomId: e.target.value ? Number(e.target.value) : null,
                    })}
                  >
                    <option value="">Chưa phân phòng / thiết bị dùng chung</option>
                    {rooms.map((room) => (
                      <option key={room.roomId} value={room.roomId}>{room.roomName}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </>
            )}

            {/* Trạng thái dùng chung */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Trạng thái</Form.Label>
              <Form.Select name="status" value={formData.status || "Active"} onChange={handleChange}>
                <option value="Active">Đang hoạt động</option>
                
                
                <option value="Maintenance">Bảo trì</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button variant="danger" type="submit" style={{ backgroundColor: "#800020" }}>
              {isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA (Giao diện đẹp mới thêm) */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="bg-danger text-white border-0">
          <Modal.Title className="fw-bold fs-5">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>Xác nhận xóa
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <h5 className="mb-3">Bạn có chắc chắn muốn xóa tài nguyên này?</h5>
          <p className="text-muted mb-0">Hành động này không thể hoàn tác. Nếu tài nguyên đang được sử dụng, hệ thống sẽ chặn thao tác này.</p>
        </Modal.Body>
        <Modal.Footer className="bg-light border-0 justify-content-center">
          <Button variant="secondary" className="px-4" onClick={() => setShowDeleteModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" className="px-4" style={{ backgroundColor: "#800020" }} onClick={executeDelete}>
            Vâng, Xóa nó!
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  );
};

// --- COMPONENT CON CHO BẢNG PHÒNG ---
const RoomTable = ({ rooms, onEdit, onDelete }) => {
  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Body className="p-0">
        <Table hover responsive className="align-middle mb-0 manager-list-table">
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Tên phòng</th><th>Loại phòng</th><th>Trạng thái</th><th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length > 0 ? rooms.map((r) => (
              <tr key={r.roomId}>
                <td className="fw-bold text-muted">#{r.roomId}</td>
                <td className="fw-bold">{r.roomName}</td>
                <td>{r.roomType}</td>
                <td>
                  <Badge bg={r.status === "Active" ? "success" : r.status === "Maintenance" ? "warning" : "secondary"}>
                    {r.status === "Active" ? "Đang hoạt động" : r.status === "Maintenance" ? "Bảo trì" : r.status}
                  </Badge>
                </td>
                <td>
                  <div className="manager-list-actions">
                  <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => onEdit(r)}><i className="bi bi-pencil-square"></i> Sửa</Button>
                  <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => onDelete(r.roomId)}><i className="bi bi-trash"></i> Xóa</Button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="text-center text-muted py-4">Chưa có dữ liệu phòng.</td></tr>}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

// --- COMPONENT CON CHO BẢNG GIƯỜNG ---
const BedTable = ({ beds, rooms, onEdit, onDelete }) => {
  const getRoomName = (roomId) => rooms.find(r => r.roomId === roomId)?.roomName || `Phòng #${roomId}`;
  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Body className="p-0">
        <Table hover responsive className="align-middle mb-0 manager-list-table">
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Mã Giường</th><th>Thuộc phòng</th><th>Trạng thái</th><th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {beds.length > 0 ? beds.map((b) => (
              <tr key={b.bedId}>
                <td className="fw-bold text-muted">#{b.bedId}</td>
                <td className="fw-bold">{b.bedNumber}</td>
                <td>{getRoomName(b.roomId)}</td>
                <td>
                  <Badge bg={b.status === "Active" ? "success" : b.status === "Maintenance" ? "warning" : "secondary"}>
                    {b.status === "Active" ? "Đang hoạt động" : b.status === "Maintenance" ? "Bảo trì" : b.status}
                  </Badge>
                </td>
                <td>
                  <div className="manager-list-actions">
                  <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => onEdit(b)}><i className="bi bi-pencil-square"></i> Sửa</Button>
                  <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => onDelete(b.bedId)}><i className="bi bi-trash"></i> Xóa</Button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="text-center text-muted py-4">Chưa có dữ liệu giường.</td></tr>}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

// --- COMPONENT CON CHO BẢNG THIẾT BỊ ---
const EquipmentTable = ({ equipments, rooms, onEdit, onDelete }) => {
  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Body className="p-0">
        <Table hover responsive className="align-middle mb-0 manager-list-table">
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Tên thiết bị</th><th>Phòng</th><th>Mô tả</th><th>Trạng thái</th><th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {equipments.length > 0 ? equipments.map((e) => (
              <tr key={e.equipmentId}>
                <td className="fw-bold text-muted">#{e.equipmentId}</td>
                <td className="fw-bold">{e.equipmentName}</td>
                <td>{e.roomName || rooms.find((room) => Number(room.roomId) === Number(e.roomId))?.roomName || "Chưa phân phòng"}</td>
                <td>{e.description || "—"}</td>
                <td>
                  <Badge bg={e.status === "Active" ? "success" : e.status === "Maintenance" ? "warning" : "secondary"}>
                    {e.status === "Active" ? "Đang hoạt động" : e.status === "Maintenance" ? "Bảo trì" : e.status}
                  </Badge>
                </td>
                <td>
                  <div className="manager-list-actions">
                  <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => onEdit(e)}><i className="bi bi-pencil-square"></i> Sửa</Button>
                  <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => onDelete(e.equipmentId)}><i className="bi bi-trash"></i> Xóa</Button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan="6" className="text-center text-muted py-4">Chưa có dữ liệu thiết bị.</td></tr>}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default ResourceManagement;