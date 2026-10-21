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
} from "react-bootstrap";
import axios from "axios";

const API_BASE = "/api/birthday-promotions";

const getBirthdayCustomersForMonth = (customers, vouchers, month) => {
  const currentYear = new Date().getFullYear();
  const customersWithVoucherThisYear = new Set(
    vouchers
      .filter((voucher) => {
        const year = String(voucher.startDate || "").slice(0, 4);
        return Number(year) === currentYear;
      })
      .map((voucher) => String(voucher.customerId))
  );

  return customers.filter((customer) => {
    const dateOfBirth = String(customer.dateOfBirth || "");
    const monthMatch = /^\d{4}-(\d{2})/.exec(dateOfBirth)?.[1];
    const birthdayMonth = monthMatch
      ? Number(monthMatch)
      : new Date(customer.dateOfBirth).getMonth() + 1;
    return (
      birthdayMonth === month &&
      !customersWithVoucherThisYear.has(String(customer.customerId))
    );
  });
};

const BirthdayPromotion = () => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isManager = user?.role === "Manager";

  const [vouchers, setVouchers] = useState([]);
  const [birthdayCustomers, setBirthdayCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const [formData, setFormData] = useState({
    voucherId: 0,
    voucherName: "",
    discountValue: "10",
    customerId: "",
    status: "Active",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const currentMonth = new Date().getMonth() + 1;

  const loadAllData = async () => {
    try {
      // 1. Lấy tất cả voucher sinh nhật
      const voucherRes = await axios.get(API_BASE, { withCredentials: true });
      const loadedVouchers = Array.isArray(voucherRes.data) ? voucherRes.data : [];
      setVouchers(loadedVouchers);

      let customers = [];
      try {
        const customerRes = await axios.get("/api/customers", {
          withCredentials: true,
        });
        customers = Array.isArray(customerRes.data) ? customerRes.data : [];
        setAllCustomers(customers);
      } catch (err) {
        console.warn("Lỗi load customers:", err);
      }

      // 2. Lấy KH có sinh nhật trong tháng
      try {
        const birthdayRes = await axios.get(
          `${API_BASE}?action=birthday-customers`,
          { withCredentials: true }
        );
        const loadedBirthdayCustomers = Array.isArray(birthdayRes.data)
          ? birthdayRes.data
          : [];
        const locallyMatchedCustomers = getBirthdayCustomersForMonth(
          customers,
          loadedVouchers,
          currentMonth
        );
        const uniqueBirthdayCustomers = new Map(
          [...loadedBirthdayCustomers, ...locallyMatchedCustomers].map(
            (customer) => [String(customer.customerId), customer]
          )
        );
        setBirthdayCustomers([...uniqueBirthdayCustomers.values()]);
      } catch (err) {
        console.warn("Lỗi load birthday-customers:", err);
        setBirthdayCustomers(
          getBirthdayCustomersForMonth(customers, loadedVouchers, currentMonth)
        );
      }
    } catch (err) {
      console.error("Lỗi load vouchers:", err);
      setError("Không thể tải danh sách voucher");
    }
  };

  const loadAllCustomers = async () => {
    try {
      const res = await axios.get("/api/customers", {
        withCredentials: true,
      });
      setAllCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Lỗi load all-customers:", err);
      setAllCustomers([]);
      setError("Không thể tải danh sách khách hàng. Vui lòng thử lại.");
    }
  };

  // Load dữ liệu khi component mount hoặc refresh
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadAllData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenAdd = async () => {
    setError("");
    setMessage("");
    await loadAllCustomers();
    setFormData({
      voucherId: 0,
      voucherName: "Voucher Sinh Nhật",
      discountValue: "10",
      customerId: "",
      status: "Active",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (voucher) => {
    setFormData({
      voucherId: voucher.voucherId,
      voucherName: voucher.voucherName || "",
      discountValue: voucher.discountValue
        ? String(voucher.discountValue)
        : "10",
      customerId: voucher.customerId ? String(voucher.customerId) : "",
      status: voucher.status || "Active",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const handleQuickCreate = (customer) => {
    setFormData({
      voucherId: 0,
      voucherName: `Voucher Sinh Nhật - ${customer.fullName}`,
      discountValue: "10",
      customerId: String(customer.customerId),
      status: "Active",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const handleViewDetails = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDetailModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!formData.voucherName.trim()) {
      setError("Tên khuyến mãi không được để trống!");
      return;
    }
    const discountVal = parseFloat(formData.discountValue);
    if (!discountVal || discountVal <= 0 || discountVal > 100) {
      setError("Phần trăm giảm giá phải từ 1 đến 100!");
      return;
    }
    if (!formData.promotionId && !formData.customerId) {
      setError("Vui lòng chọn khách hàng!");
      return;
    }

    try {
      if (formData.voucherId > 0) {
        // Cập nhật voucher
        const existing = vouchers.find((v) => v.voucherId === formData.voucherId);
        await axios.put(
          API_BASE,
          {
            voucherId: formData.voucherId,
            voucherName: formData.voucherName,
            discountPercent: discountVal,
            startDate:
              existing?.startDate ||
              new Date().toISOString().split("T")[0] + " 00:00:00",
            endDate:
              existing?.endDate ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0] + " 23:59:59",
            status: formData.status,
          },
          { withCredentials: true }
        );
        setMessage("Cập nhật voucher thành công!");
      } else {
        // Tạo mới voucher cho 1 KH
        await axios.post(
          API_BASE,
          {
            action: "create",
            customerId: parseInt(formData.customerId),
            voucherName: formData.voucherName,
            discountPercent: discountVal,
            startDate: new Date().toISOString().split("T")[0] + " 00:00:00",
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0] + " 23:59:59",
          },
          { withCredentials: true }
        );
        setMessage(`Đã tạo voucher sinh nhật giảm ${discountVal}%!`);
      }
      setShowModal(false);
      setRefresh((prev) => prev + 1);
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi lưu khuyến mãi!"
      );
    }
  };

  const handleDelete = async (voucherId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
    try {
      await axios.delete(`${API_BASE}?id=${voucherId}`, {
        withCredentials: true,
      });
      setRefresh((prev) => prev + 1);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể xóa voucher!");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge bg="success">Đang hoạt động</Badge>;
      case "Used":
        return <Badge bg="warning" text="dark">Đã sử dụng</Badge>;
      case "Expired":
        return <Badge bg="danger">Đã hết hạn</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const filteredVouchers = vouchers.filter(
    (v) =>
      !searchTerm ||
      (v.voucherCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.voucherName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.customerName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-uppercase mb-1">
            Khuyến mãi Sinh nhật
          </h2>
          <p className="text-muted mb-0">
            Quản lý voucher dành cho khách hàng có sinh nhật trong tháng
          </p>
        </div>
        {isManager && (
          <Button
            variant="danger"
            className="fw-bold"
            onClick={handleOpenAdd}
            style={{ backgroundColor: "#a61e4d", border: "none" }}
          >
            <i className="bi bi-plus-lg me-1"></i> Tạo Voucher Sinh nhật
          </Button>
        )}
      </div>

      {message && (
        <Alert variant="success" onClose={() => setMessage("")} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}

      {/* Thẻ thống kê */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#e8f5e9" }}>
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-calendar-heart-fill text-success fs-1"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Sinh nhật tháng {currentMonth}</h6>
                <h3 className="mb-0 text-success">{birthdayCustomers.length}</h3>
                <small className="text-muted">khách hàng chưa có voucher</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#fff3e0" }}>
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-ticket-perforated-fill text-warning fs-1"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Tổng Voucher sinh nhật</h6>
                <h3 className="mb-0 text-warning">{vouchers.length}</h3>
                <small className="text-muted">voucher BDAY</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "#e3f2fd" }}>
            <Card.Body className="d-flex align-items-center">
              <div className="me-3">
                <i className="bi bi-gift-fill text-primary fs-1"></i>
              </div>
              <div>
                <h6 className="text-muted mb-1">Đang hoạt động</h6>
                <h3 className="mb-0 text-primary">
                  {vouchers.filter((v) => v.status === "Active").length}
                </h3>
                <small className="text-muted">voucher Active</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Danh sách KH sinh nhật tháng này */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-success text-white">
          <i className="bi bi-star-fill me-2"></i>
          <strong>Khách hàng sinh nhật tháng {currentMonth}</strong>
          <span className="ms-2">
            ({birthdayCustomers.length} người chưa có voucher năm nay)
          </span>
        </Card.Header>
        <Card.Body className="p-0">
          {birthdayCustomers.length > 0 ? (
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Khách hàng</th>
                  <th>Ngày sinh</th>
                  <th>Điện thoại</th>
                  <th>Email</th>
                  {isManager && <th>Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {birthdayCustomers.map((c) => (
                  <tr key={c.customerId}>
                    <td className="fw-bold">{c.fullName}</td>
                    <td>{formatDate(c.dateOfBirth)}</td>
                    <td>{c.phone || "-"}</td>
                    <td>{c.email || "-"}</td>
                    {isManager && (
                      <td>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleQuickCreate(c)}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Tạo Voucher
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-info-circle me-2"></i>
              Không có khách hàng nào có sinh nhật trong tháng này chưa được tặng voucher.
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Tìm kiếm */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <InputGroup style={{ maxWidth: "400px" }}>
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Tìm theo mã, tên voucher hoặc khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Danh sách voucher sinh nhật */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-dark text-white">
          <i className="bi bi-list-ul me-2"></i>
          <strong>Danh sách Voucher sinh nhật</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <Table striped bordered hover responsive className="align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Mã Voucher</th>
                <th>Tên khuyến mãi</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Giảm giá</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Trạng thái</th>
                {isManager && <th className="text-center">Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((v) => (
                  <tr key={v.voucherId}>
                    <td>
                      <Badge bg="primary" className="font-monospace">
                        {v.voucherCode}
                      </Badge>
                    </td>
                    <td className="fw-bold">{v.voucherName}</td>
                    <td>{v.customerName || "-"}</td>
                    <td>{v.customerPhone || "-"}</td>
                    <td className="text-danger fw-bold">
                      {v.discountValue}%
                    </td>
                    <td>{formatDate(v.startDate)}</td>
                    <td>{formatDate(v.endDate)}</td>
                    <td>{getStatusBadge(v.status)}</td>
                    {isManager && (
                      <td className="text-center">
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2 text-white"
                          onClick={() => handleViewDetails(v)}
                          title="Xem chi tiết"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenEdit(v)}
                          title="Sửa"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(v.voucherId)}
                          title="Xóa"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isManager ? 9 : 8}
                    className="text-center py-4 text-muted"
                  >
                    Chưa có voucher sinh nhật nào.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Thêm / Sửa */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <i className="bi bi-gift me-2"></i>
            {formData.voucherId
              ? "Cập nhật Voucher sinh nhật"
              : "Tạo Voucher sinh nhật"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && (
              <Alert variant="danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Chọn khách hàng <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                disabled={formData.voucherId > 0}
              >
                <option value="">-- Chọn khách hàng --</option>
                {allCustomers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.fullName} - {formatDate(c.dateOfBirth)} -{" "}
                    {c.phone || "Không SĐT"}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Chọn khách hàng để tạo voucher sinh nhật
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Tên khuyến mãi <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="voucherName"
                value={formData.voucherName}
                onChange={handleChange}
                required
                placeholder="VD: Voucher Sinh Nhật - Nguyễn Văn A"
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Phần trăm giảm giá (%) <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    required
                  />
                </Form.Group>
              </Col>
              {formData.voucherId > 0 && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Trạng thái</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Active">Đang hoạt động</option>
                      <option value="Expired">Đã hết hạn</option>
                      <option value="Used">Đã sử dụng</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
            </Row>

            <Alert variant="info" className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Voucher sẽ có thời hạn 30 ngày kể từ ngày tạo.
            </Alert>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              type="submit"
              style={{ backgroundColor: "#a61e4d", border: "none" }}
            >
              <i className="bi bi-check-lg me-1"></i>
              {formData.voucherId ? "Lưu thay đổi" : "Tạo Voucher"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Chi tiết */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <i className="bi bi-info-circle me-2"></i>
            Chi tiết Voucher sinh nhật
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVoucher && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Mã Voucher:</strong>
                  <p className="mb-0">
                    <Badge bg="primary" className="font-monospace">
                      {selectedVoucher.voucherCode}
                    </Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <strong>Trạng thái:</strong>
                  <p className="mb-0">
                    {getStatusBadge(selectedVoucher.status)}
                  </p>
                </Col>
              </Row>
              <div className="mb-3">
                <strong>Tên khuyến mãi:</strong>
                <p className="mb-0">{selectedVoucher.voucherName}</p>
              </div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Khách hàng:</strong>
                  <p className="mb-0">
                    {selectedVoucher.customerName || "-"}
                  </p>
                </Col>
                <Col md={6}>
                  <strong>Số điện thoại:</strong>
                  <p className="mb-0">
                    {selectedVoucher.customerPhone || "-"}
                  </p>
                </Col>
              </Row>
              <div className="mb-3">
                <strong>Giảm giá:</strong>
                <p className="mb-0 text-danger fw-bold fs-5">
                  {selectedVoucher.discountValue}%
                </p>
              </div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Ngày bắt đầu:</strong>
                  <p className="mb-0">
                    {formatDate(selectedVoucher.startDate)}
                  </p>
                </Col>
                <Col md={6}>
                  <strong>Ngày kết thúc:</strong>
                  <p className="mb-0">
                    {formatDate(selectedVoucher.endDate)}
                  </p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDetailModal(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BirthdayPromotion;
