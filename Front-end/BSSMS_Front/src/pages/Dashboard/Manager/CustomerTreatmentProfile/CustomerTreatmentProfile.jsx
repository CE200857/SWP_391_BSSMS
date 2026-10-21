import { useState, useEffect } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Modal,
  Alert,
  Badge,
  Row,
  Col,
  Tabs,
  Tab,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const toDateInputValue = (dateValue) => {
  if (!dateValue) return "";

  const dateText = String(dateValue).trim();
  const isoDateMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(dateText);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) return "";
  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const CustomerTreatmentProfile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(0);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isCustomer = user?.role === "Customer";
  const canViewAll = user?.role === "Manager" || user?.role === "Technician" || user?.role === "Receptionist";
  const canEdit = user?.role === "Manager" || user?.role === "Technician";

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customerPackageId: 0,
    remainingSessions: "",
    expiryDate: "",
    status: "Active",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách khách hàng (cho Manager/Technician/Receptionist)
        if (canViewAll) {
          try {
            const customerRes = await axios.get("/api/customers", {
              withCredentials: true,
            });
            setCustomers(customerRes.data);
          } catch (err) {
            console.warn("Không tải được danh sách khách hàng:", err);
            setCustomers([]);
          }
        }

        // Xác định customerId cần load
        let targetCustomerId = customerId;
        if (!targetCustomerId && isCustomer) {
          // Customer xem profile của chính mình
          targetCustomerId = user.customerId;
        }

        if (targetCustomerId) {
          // Lấy thông tin khách hàng
          try {
            const infoRes = await axios.get(
              `/api/customers?id=${targetCustomerId}`,
              { withCredentials: true }
            );
            setCustomerInfo(infoRes.data);
          } catch (err) {
            console.warn("Không tải được thông tin khách hàng:", err);
            setCustomerInfo(null);
          }

          // Lấy danh sách gói liệu trình đã mua (CustomerPackageServlet hỗ trợ ?customerId=X)
          try {
            const packageRes = await axios.get(
              `/api/customer-packages?customerId=${targetCustomerId}`,
              { withCredentials: true }
            );
            const pkgList = Array.isArray(packageRes.data)
              ? packageRes.data
              : [];
            setPackages(pkgList);
          } catch (err) {
            console.warn("Không tải được danh sách gói liệu trình:", err);
            setPackages([]);
          }

          // Lấy hồ sơ điều trị (TreatmentProfileServlet)
          try {
            const profileRes = await axios.get(
              `/api/treatment-profiles?customerId=${targetCustomerId}`,
              { withCredentials: true }
            );
            const profileList = Array.isArray(profileRes.data)
              ? profileRes.data
              : [];
            setAppointments(profileList);
          } catch (err) {
            console.warn("Không tải được hồ sơ điều trị:", err);
            setAppointments([]);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };
    fetchData();
  }, [customerId, isCustomer, user, canViewAll, refresh]);

  const handleCustomerSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      navigate(`/treatment-profile/${selectedId}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleOpenEdit = (pkg) => {
    setSelectedPackage(pkg);
    setEditFormData({
      customerPackageId: pkg.customerPackageId,
      remainingSessions: pkg.remainingSessions,
      expiryDate: toDateInputValue(pkg.expiryDate),
      status: pkg.status,
    });
    setError("");
    setMessage("");
    setShowEditModal(true);
  };

  const handleViewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setShowDetailModal(true);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setError("");

    if (!editFormData.remainingSessions || parseInt(editFormData.remainingSessions) < 0) {
      setError("Số buổi còn lại không hợp lệ!");
      return;
    }

    try {
      // Gửi remainingSessions dưới dạng số
      const payload = {
        customerPackageId: editFormData.customerPackageId,
        remainingSessions: parseInt(editFormData.remainingSessions),
        expiryDate:
          editFormData.expiryDate || toDateInputValue(selectedPackage?.expiryDate) || null,
        status: editFormData.status || "Active",
      };
      const res = await axios.put("/api/customer-packages", payload, {
        withCredentials: true,
      });
      setMessage(res.data?.message || "Cập nhật hồ sơ liệu trình thành công!");
      setShowEditModal(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      console.error("Update error:", err);
      console.error("Response:", err.response);
      const responseData = err.response?.data;
      const responseMessage =
        typeof responseData === "string"
          ? responseData
          : responseData?.message || responseData?.error;
      setError(
        responseMessage ||
          (err.response?.status
            ? `Cập nhật thất bại (HTTP ${err.response.status}).`
            : "Không thể kết nối đến máy chủ.")
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge bg="success">Đang hoạt động</Badge>;
      case "Completed":
        return <Badge bg="primary">Hoàn thành</Badge>;
      case "Expired":
        return <Badge bg="danger">Đã hết hạn</Badge>;
      case "Cancelled":
        return <Badge bg="secondary">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getAppointmentStatusBadge = (status) => {
    switch (status) {
      case "Scheduled":
        return <Badge bg="info">Đã đặt</Badge>;
      case "CheckedIn":
        return <Badge bg="primary">Đã check-in</Badge>;
      case "InProgress":
        return <Badge bg="warning" text="dark">Đang điều trị</Badge>;
      case "Completed":
        return <Badge bg="success">Hoàn thành</Badge>;
      case "Cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const filteredPackages = packages.filter(
    (p) =>
      !searchTerm ||
      p.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.serviceName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-uppercase mb-1">
            Hồ sơ Liệu trình
          </h2>
          <p className="text-muted mb-0">
            Xem và quản lý các gói liệu trình đã mua
          </p>
        </div>
      </div>

      {message && (
        <Alert variant="success" onClose={() => setMessage("")} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
        </Alert>
      )}

      {/* Chọn khách hàng (cho Manager/Technician/Receptionist) */}
      {canViewAll && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    <i className="bi bi-person-badge me-2"></i>
                    Chọn khách hàng
                  </Form.Label>
                  <Form.Select
                    value={customerId || ""}
                    onChange={handleCustomerSelect}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.fullName} - {c.phone || "Không có SĐT"}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              {customerInfo && (
                <Col md={6}>
                  <div className="bg-light p-3 rounded">
                    <strong>Thông tin khách hàng:</strong>
                    <p className="mb-0">
                      {customerInfo.fullName} | {customerInfo.phone || "-"} |{" "}
                      {customerInfo.email || "-"}
                    </p>
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Thông tin khách hàng hiện tại (cho Customer) */}
      {isCustomer && customerInfo && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row>
              <Col md={3} className="text-center">
                <div
                  className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center text-white"
                  style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                >
                  {customerInfo.fullName?.charAt(0).toUpperCase()}
                </div>
              </Col>
              <Col md={9}>
                <h4 className="mb-3">{customerInfo.fullName}</h4>
                <Row>
                  <Col md={4}>
                    <p className="mb-1 text-muted small">Số điện thoại</p>
                    <p className="mb-0 fw-bold">{customerInfo.phone || "-"}</p>
                  </Col>
                  <Col md={4}>
                    <p className="mb-1 text-muted small">Email</p>
                    <p className="mb-0 fw-bold">{customerInfo.email || "-"}</p>
                  </Col>
                  <Col md={4}>
                    <p className="mb-1 text-muted small">Ngày sinh</p>
                    <p className="mb-0 fw-bold">{formatDate(customerInfo.dateOfBirth)}</p>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Tabs cho Packages và Appointments */}
      <Tabs defaultActiveKey="packages" className="mb-3">
        <Tab eventKey="packages" title={
          <span>
            <i className="bi bi-box2-heart me-2"></i>
            Gói liệu trình ({packages.length})
          </span>
        }>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <InputGroup className="mb-3" style={{ maxWidth: "400px" }}>
                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                <Form.Control
                  placeholder="Tìm kiếm gói liệu trình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <Table striped bordered hover responsive className="align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Treatment Package ID</th>
                    <th>Ngày mua</th>
                    <th>Buổi còn lại</th>
                    <th>Ngày hết hạn</th>
                    <th>Trạng thái</th>
                    {canEdit && <th className="text-center">Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.length > 0 ? (
                    filteredPackages.map((p) => (
                      <tr key={p.customerPackageId}>
                        <td className="fw-bold">#{p.customerPackageId}</td>
                        <td>
                          <Badge bg="info">Package #{p.treatmentPackageId}</Badge>
                        </td>
                        <td>{formatDate(p.purchaseDate)}</td>
                        <td>
                          <Badge bg={p.remainingSessions > 0 ? "success" : "secondary"}>
                            {p.remainingSessions} buổi
                          </Badge>
                        </td>
                        <td>{formatDate(p.expiryDate)}</td>
                        <td>{getStatusBadge(p.status)}</td>
                        {canEdit && (
                          <td className="text-center">
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2 text-white"
                              onClick={() => handleViewDetails(p)}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button
                              variant="warning"
                              size="sm"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <i className="bi bi-pencil-square"></i> Sửa
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canEdit ? "7" : "6"} className="text-center py-4 text-muted">
                        Chưa có gói liệu trình nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="appointments" title={
          <span>
            <i className="bi bi-calendar-check me-2"></i>
            Lịch sử cuộc hẹn ({appointments.length})
          </span>
        }>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <Table striped bordered hover responsive className="align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Ngày hẹn</th>
                    <th>Giờ bắt đầu</th>
                    <th>Dịch vụ / Gói</th>
                    <th>Nhân viên</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? (
                    appointments.map((a) => (
                      <tr key={a.appointmentId}>
                        <td className="fw-bold">#{a.appointmentId}</td>
                        <td>{formatDate(a.appointmentDate)}</td>
                        <td>
                          {a.startTime
                            ? a.startTime.substring(0, 5)
                            : "-"}
                        </td>
                        <td>
                          {a.serviceName ? (
                            <div>
                              <strong>{a.serviceName}</strong>
                              {a.packageName && (
                                <div>
                                  <small className="text-muted">
                                    Gói: {a.packageName}
                                  </small>
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{a.staffName || "-"}</td>
                        <td>
                          {a.rating ? (
                            <span className="text-warning">
                              {"★".repeat(a.rating)}
                              <span className="text-muted">
                                {"☆".repeat(5 - a.rating)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>{getAppointmentStatusBadge(a.appointmentStatus)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        Chưa có lịch hẹn nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal Sửa hồ sơ */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <i className="bi bi-pencil-square me-2"></i>
            Cập nhật Hồ sơ Liệu trình
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitEdit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}

            {selectedPackage && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Mã Customer Package</Form.Label>
                  <Form.Control
                    value={`#${selectedPackage.customerPackageId} - Treatment Package #${selectedPackage.treatmentPackageId}`}
                    disabled
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        Số buổi còn lại <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="remainingSessions"
                        value={editFormData.remainingSessions}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Trạng thái</Form.Label>
                      <Form.Select
                        name="status"
                        value={editFormData.status}
                        onChange={handleChange}
                      >
                        <option value="Active">Đang hoạt động</option>
                        <option value="Completed">Hoàn thành</option>
                        <option value="Expired">Đã hết hạn</option>
                        <option value="Cancelled">Đã hủy</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label className="fw-bold">Ngày hết hạn</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiryDate"
                    value={editFormData.expiryDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="bg-light border-0">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <i className="bi bi-check-lg me-1"></i>
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Chi tiết */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <i className="bi bi-info-circle me-2"></i>
            Chi tiết Hồ sơ Liệu trình
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPackage && (
            <Row>
              <Col md={6}>
                <p className="mb-2"><strong>ID:</strong> #{selectedPackage.customerPackageId}</p>
                <p className="mb-2">
                  <strong>Treatment Package ID:</strong> #
                  {selectedPackage.treatmentPackageId}
                </p>
                <p className="mb-2">
                  <strong>Customer ID:</strong> #{selectedPackage.customerId}
                </p>
                <p className="mb-2"><strong>Ngày mua:</strong> {formatDate(selectedPackage.purchaseDate)}</p>
              </Col>
              <Col md={6}>
                <p className="mb-2">
                  <strong>Buổi còn lại:</strong>{" "}
                  <Badge bg={selectedPackage.remainingSessions > 0 ? "success" : "secondary"}>
                    {selectedPackage.remainingSessions} buổi
                  </Badge>
                </p>
                <p className="mb-2"><strong>Ngày hết hạn:</strong> {formatDate(selectedPackage.expiryDate)}</p>
                <p className="mb-2"><strong>Trạng thái:</strong> {getStatusBadge(selectedPackage.status)}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Đóng
          </Button>
          {canEdit && selectedPackage && (
            <Button variant="warning" onClick={() => {
              setShowDetailModal(false);
              handleOpenEdit(selectedPackage);
            }}>
              <i className="bi bi-pencil-square me-1"></i>
              Chỉnh sửa
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CustomerTreatmentProfile;
