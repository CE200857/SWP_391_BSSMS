import { useState, useEffect } from "react";
import { Container, Card, Table, Button, Form, InputGroup, Modal, Badge, Alert, Tabs, Tab } from "react-bootstrap";
import axios from "axios";

const ResourceManagement = () => {
  const [activeTab, setActiveTab] = useState("rooms");
  const [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Dữ liệu cho 3 danh mục
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [equipments, setEquipments] = useState([]);

  // Quản lý Modal chung
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Quản lý Modal Xóa (Mới thêm)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Dữ liệu Form linh hoạt
  const [formData, setFormData] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "null");
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
          const response = await axios.get("/api/equipment", { withCredentials: true });
          setEquipments(response.data);
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
      setFormData({ roomId: 0, roomName: "", roomType: "Treatment", status: "Available" });
    } else if (activeTab === "beds") {
      setFormData({ bedId: 0, roomId: rooms.length > 0 ? rooms[0].roomId : "", bedNumber: "", status: "Available" });
    } else if (activeTab === "equipments") {
      setFormData({ equipmentId: 0, equipmentName: "", description: "", status: "Available" });
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-uppercase" style={{ color: "#800020" }}>Quản lý Tài nguyên</h2>
        <Button variant="danger" className="fw-bold" style={{ backgroundColor: "#800020" }} onClick={handleOpenAdd}>
          <i className="bi bi-plus-lg me-1"></i> Thêm mới
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-4 rounded-3">
        <Card.Body>
          <InputGroup style={{ maxWidth: "400px" }}>
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control
              placeholder={`Tìm kiếm ${activeTab === 'rooms' ? 'phòng' : activeTab === 'beds' ? 'giường' : 'thiết bị'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* TABS CHUYỂN ĐỔI */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => { setActiveTab(k); setSearchTerm(""); }}
        className="mb-3"
      >
        <Tab eventKey="rooms" title="Phòng (Room)">
          <RoomTable 
            rooms={rooms} 
            searchTerm={searchTerm} 
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
          />
        </Tab>
        <Tab eventKey="beds" title="Giường (Bed)">
          <BedTable 
            beds={beds} 
            rooms={rooms} 
            searchTerm={searchTerm} 
            onEdit={handleOpenEdit} 
            onDelete={handleDelete} 
          />
        </Tab>
        <Tab eventKey="equipments" title="Thiết bị (Equipment)">
          <EquipmentTable 
            equipments={equipments} 
            searchTerm={searchTerm} 
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
              </>
            )}

            {/* Trạng thái dùng chung */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Trạng thái</Form.Label>
              <Form.Select name="status" value={formData.status || "Available"} onChange={handleChange}>
                <option value="Available">Available (Sẵn sàng)</option>
                {activeTab !== "rooms" && <option value="In Use">In Use (Đang dùng)</option>}
                {activeTab === "rooms" && <option value="Occupied">Occupied (Đang dùng)</option>}
                <option value="Maintenance">Maintenance (Bảo trì)</option>
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
const RoomTable = ({ rooms, searchTerm, onEdit, onDelete }) => {
  const filtered = rooms.filter(r => r.roomName?.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Body className="p-0">
        <Table striped bordered hover responsive className="align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Tên phòng</th><th>Loại phòng</th><th>Trạng thái</th><th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((r) => (
              <tr key={r.roomId}>
                <td className="fw-bold text-muted">#{r.roomId}</td>
                <td className="fw-bold">{r.roomName}</td>
                <td>{r.roomType}</td>
                <td>
                  <Badge bg={r.status === "Available" ? "success" : r.status === "Occupied" ? "warning" : "danger"}>
                    {r.status === "Available" ? "Trống" : r.status === "Occupied" ? "Đang sử dụng" : "Bảo trì"}
                  </Badge>
                </td>
                <td className="text-center">
                  <Button variant="outline-warning" size="sm" className="me-2" onClick={() => onEdit(r)}><i className="bi bi-pencil-square"></i> Sửa</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => onDelete(r.roomId)}><i className="bi bi-trash"></i> Xóa</Button>
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
const BedTable = ({ beds, rooms, searchTerm, onEdit, onDelete }) => {
  const filtered = beds.filter(b => b.bedNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
  const getRoomName = (roomId) => rooms.find(r => r.roomId === roomId)?.roomName || `Phòng #${roomId}`;
  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Body className="p-0">
        <Table striped bordered hover responsive className="align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Mã Giường</th><th>Thuộc phòng</th><th>Trạng thái</th><th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((b) => (
              <tr key={b.bedId}>
                <td className="fw-bold text-muted">#{b.bedId}</td>
                <td className="fw-bold">{b.bedNumber}</td>
                <td>{getRoomName(b.roomId)}</td>
                <td>
                  <Badge bg={b.status === "Available" ? "success" : b.status === "In Use" ? "warning" : "danger"}>
                    {b.status === "Available" ? "Trống" : b.status === "In Use" ? "Đang sử dụng" : "Bảo trì"}
                  </Badge>
                </td>
                <td className="text-center">
                  <Button variant="outline-warning" size="sm" className="me-2" onClick={() => onEdit(b)}><i className="bi bi-pencil-square"></i> Sửa</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => onDelete(b.bedId)}><i className="bi bi-trash"></i> Xóa</Button>
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
const EquipmentTable = ({ equipments, searchTerm, onEdit, onDelete }) => {
  const filtered = equipments.filter(e => e.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <Card className="shadow-sm border-0 rounded-3">
      <Card.Body className="p-0">
        <Table striped bordered hover responsive className="align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>ID</th><th>Tên thiết bị</th><th>Mô tả</th><th>Trạng thái</th><th className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((e) => (
              <tr key={e.equipmentId}>
                <td className="fw-bold text-muted">#{e.equipmentId}</td>
                <td className="fw-bold">{e.equipmentName}</td>
                <td>{e.description || "—"}</td>
                <td>
                  <Badge bg={e.status === "Available" ? "success" : e.status === "In Use" ? "warning" : "danger"}>
                    {e.status === "Available" ? "Trống" : e.status === "In Use" ? "Đang sử dụng" : "Bảo trì"}
                  </Badge>
                </td>
                <td className="text-center">
                  <Button variant="outline-warning" size="sm" className="me-2" onClick={() => onEdit(e)}><i className="bi bi-pencil-square"></i> Sửa</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => onDelete(e.equipmentId)}><i className="bi bi-trash"></i> Xóa</Button>
                </td>
              </tr>
            )) : <tr><td colSpan="5" className="text-center text-muted py-4">Chưa có dữ liệu thiết bị.</td></tr>}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
};

export default ResourceManagement;