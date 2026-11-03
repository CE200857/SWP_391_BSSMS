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
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const canManage = user?.role === "Manager" || user?.role === "Receptionist";
  const canIssueBirthdayBenefits = user?.role === "Manager";

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isIssuingBenefits, setIsIssuingBenefits] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [detailVoucher, setDetailVoucher] = useState(null);
  const [formData, setFormData] = useState({
    voucherId: 0,
    customerId: "",
    voucherCode: "",
    voucherName: "",
    discountType: "Percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
    status: "Active",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const voucherRes = await axios.get("/api/vouchers", {
          withCredentials: true,
        });
        setVouchers(voucherRes.data);

        // Endpoint lấy khách hàng cần cho dropdown (chỉ Manager & Receptionist)
        try {
          const customerRes = await axios.get("/api/customers", {
            withCredentials: true,
          });
          setCustomers(customerRes.data);
        } catch (err) {
          console.warn("Không tải được danh sách khách hàng (có thể do phân quyền):", err);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu voucher:", error);
      }
    };
    fetchData();
  }, [refresh]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      voucherId: 0,
      customerId: "",
      voucherCode: generateVoucherCode(),
      voucherName: "",
      discountType: "Percentage",
      discountValue: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      status: "Active",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const handleOpenEdit = (voucher) => {
    setIsEdit(true);
    setFormData({
      voucherId: voucher.voucherId,
      customerId: voucher.customerId || "",
      voucherCode: voucher.voucherCode,
      voucherName: voucher.voucherName || "",
      discountType: voucher.discountType || "Percentage",
      discountValue: voucher.discountValue || "",
      startDate: voucher.startDate ? voucher.startDate.split("T")[0] : "",
      endDate: voucher.endDate ? voucher.endDate.split("T")[0] : "",
      status: voucher.status || "Active",
    });
    setError("");
    setMessage("");
    setShowModal(true);
  };

  const generateVoucherCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "VCH-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Validation
    if (!formData.voucherCode.trim()) {
      setError("Mã voucher không được để trống!");
      return;
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      setError("Giá trị giảm giá phải lớn hơn 0!");
      return;
    }

    if (formData.discountType === "Percentage" && parseFloat(formData.discountValue) > 100) {
      setError("Phần trăm giảm giá không được vượt quá 100%!");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Vui lòng chọn ngày bắt đầu và ngày kết thúc!");
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("Ngày kết thúc phải sau ngày bắt đầu!");
      return;
    }

    try {
      if (isEdit) {
        // Backend dùng POST với action="update" (không có PUT)
        await axios.post(
          "/api/vouchers",
          { ...formData, action: "update" },
          { withCredentials: true }
        );
        setMessage("Cập nhật voucher thành công!");
      } else {
        // Tạo mới - bỏ status field vì backend mặc định 'Active'
        const createData = { ...formData };
        delete createData.status;
        await axios.post("/api/vouchers", createData, {
          withCredentials: true,
        });
        setMessage("Tạo voucher mới thành công!");
      }
      setShowModal(false);
      setRefresh((prev) => prev + 1);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi lưu voucher!"
      );
    }
  };

  const handleDeleteClick = (voucher) => {
    setSelectedVoucher(voucher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedVoucher) return;

    try {
      await axios.delete(`/api/vouchers?id=${selectedVoucher.voucherId}`, {
        withCredentials: true,
      });
      setRefresh((prev) => prev + 1);
      setShowDeleteModal(false);
      setSelectedVoucher(null);
    } catch {
      alert("Không thể xóa voucher này!");
    }
  };

  const handleIssueBirthdayBenefits = async () => {
    if (isIssuingBenefits) return;
    setIsIssuingBenefits(true);
    setError("");
    setMessage("");
    try {
      await axios.post(
        "/api/operations/policy",
        { action: "issueBenefits" },
        { withCredentials: true },
      );
      setMessage(
        "Đã cấp ưu đãi tháng hiện tại cho khách đủ điều kiện. Không cấp trùng.",
      );
      setRefresh((previous) => previous + 1);
    } catch (requestError) {
      console.error("Lỗi cấp ưu đãi sinh nhật:", requestError);
      setError(
        requestError.response?.data?.message ||
          "Không thể cấp ưu đãi tháng này. Vui lòng thử lại.",
      );
    } finally {
      setIsIssuingBenefits(false);
    }
  };

  const getCustomerName = (customerId) => {
    if (!customerId) return "Tất cả khách hàng";
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.fullName : `Khách hàng #${customerId}`;
  };

  const { filteredRows: filteredVouchers, toolbar } = useManagerSearchFilter(
    vouchers,
    [
      { key: "voucherCode", label: "Mã voucher", filterable: false },
      { key: "voucherName", label: "Tên voucher", filterable: false },
      {
        key: "customerId",
        label: "Khách hàng",
        getValue: (voucher) => getCustomerName(voucher.customerId),
      },
      {
        key: "status",
        label: "Trạng thái",
        formatValue: (value) => ({
          Active: "Đang hoạt động",
          Used: "Đã sử dụng",
          Expired: "Đã hết hạn",
        }[value] || value),
      },
      { key: "startDate", label: "Thời gian áp dụng", type: "date" },
    ],
    "Tìm theo mã, tên voucher hoặc khách hàng...",
  );

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
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <Container fluid className="mt-4 px-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="manager-page-title fw-bold mb-1">Voucher &amp; ưu đãi sinh nhật</h2>
          {canIssueBirthdayBenefits && (
            <p className="text-muted mb-0">
              Quản lý voucher và cấp ưu đãi tháng sinh nhật cho khách đủ điều kiện.
            </p>
          )}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {canIssueBirthdayBenefits && (
            <Button
              variant="outline-danger"
              onClick={handleIssueBirthdayBenefits}
              disabled={isIssuingBenefits}
            >
              {isIssuingBenefits ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Đang cấp ưu đãi...
                </>
              ) : (
                <>
                  <i className="bi bi-gift me-2" aria-hidden="true" />
                  Cấp ưu đãi tháng này
                </>
              )}
            </Button>
          )}
          {canManage && (
            <Button
              variant="danger"
              className="fw-bold"
              onClick={handleOpenAdd}
              style={{ backgroundColor: "#a61e4d", border: "none" }}
            >
              <i className="bi bi-ticket-perforated me-1"></i> Tạo Voucher mới
            </Button>
          )}
        </div>
      </div>

      {message && (
        <Alert variant="success" onClose={() => setMessage("")} dismissible>
          <i className="bi bi-check-circle-fill me-2"></i>
          {message}
        </Alert>
      )}

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="manager-list-toolbar">{toolbar}</div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table hover responsive className="align-middle mb-0 manager-list-table">
            <thead className="table-dark">
              <tr>
                <th>Mã Voucher</th>
                <th>Khách hàng</th>
                <th>Ưu đãi</th>
                <th>Trạng thái</th>
                <th className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((v) => (
                  <tr key={v.voucherId}>
                    <td>
                      <Badge bg-primary className="font-monospace">
                        {v.voucherCode}
                      </Badge>
                    </td>
                    <td>{getCustomerName(v.customerId)}</td>
                    <td className="text-danger fw-bold">
                      {v.discountType === "Percentage"
                        ? `${v.discountValue}%`
                        : `${Number(v.discountValue).toLocaleString("vi-VN")} VNĐ`}
                      <div className="small text-muted fw-normal">
                        {v.discountType === "Percentage" ? "Phần trăm" : "Số tiền cố định"}
                      </div>
                    </td>
                    <td>{getStatusBadge(v.status)}</td>
                    <td className="text-center">
                      <Button
                        variant="link"
                        size="sm"
                        className="manager-list-action manager-list-action--view"
                        onClick={() => setDetailVoucher(v)}
                      >
                        <i className="bi bi-eye-fill" aria-hidden="true" />
                        Xem
                      </Button>
                      {canManage && (
                        <>
                        <Button
                          variant="link"
                          size="sm"
                          className="manager-list-action manager-list-action--edit"
                          onClick={() => handleOpenEdit(v)}
                          disabled={v.status === "Used"}
                        >
                          <i className="bi bi-pencil-square"></i> Sửa
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="manager-list-action manager-list-action--delete"
                          onClick={() => handleDeleteClick(v)}
                        >
                          <i className="bi bi-trash"></i> Xóa
                        </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4 text-muted"
                  >
                    Chưa có voucher nào.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal
        show={!!detailVoucher}
        onHide={() => setDetailVoucher(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết voucher</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <dl className="row mb-0">
            <dt className="col-sm-5">Mã voucher</dt>
            <dd className="col-sm-7">{detailVoucher?.voucherCode || "—"}</dd>
            <dt className="col-sm-5">Tên voucher</dt>
            <dd className="col-sm-7">{detailVoucher?.voucherName || "—"}</dd>
            <dt className="col-sm-5">Khách hàng</dt>
            <dd className="col-sm-7">
              {detailVoucher ? getCustomerName(detailVoucher.customerId) : "—"}
            </dd>
            <dt className="col-sm-5">Giá trị giảm</dt>
            <dd className="col-sm-7">
              {detailVoucher?.discountType === "Percentage"
                ? `${detailVoucher.discountValue}%`
                : detailVoucher
                  ? `${Number(detailVoucher.discountValue).toLocaleString("vi-VN")} VNĐ`
                  : "—"}
            </dd>
            <dt className="col-sm-5">Thời hạn</dt>
            <dd className="col-sm-7">
              {detailVoucher
                ? `${formatDate(detailVoucher.startDate)} – ${formatDate(detailVoucher.endDate)}`
                : "—"}
            </dd>
            <dt className="col-sm-5">Trạng thái</dt>
            <dd className="col-sm-7">{detailVoucher?.status || "—"}</dd>
          </dl>
        </Modal.Body>
      </Modal>

      {/* Modal Thêm / Sửa Voucher */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <i className="bi bi-ticket-perforated me-2"></i>
            {isEdit ? "Cập nhật Voucher" : "Tạo Voucher mới"}
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

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Mã Voucher <span className="text-danger">*</span>
                  </Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      name="voucherCode"
                      value={formData.voucherCode}
                      onChange={handleChange}
                      required
                    />
                    {!isEdit && (
                      <Button
                        variant="outline-secondary"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            voucherCode: generateVoucherCode(),
                          })
                        }
                      >
                        <i className="bi bi-arrow-clockwise"></i>
                      </Button>
                    )}
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Tên Voucher</Form.Label>
                  <Form.Control
                    type="text"
                    name="voucherName"
                    value={formData.voucherName}
                    onChange={handleChange}
                    placeholder="VD: Giảm giá 20% dịch vụ"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Khách hàng <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    <option value="">Tất cả khách hàng</option>
                    {customers.map((c) => (
                      <option key={c.customerId} value={c.customerId}>
                        {c.fullName} - {c.phone}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Để trống để áp dụng cho tất cả khách hàng
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Trạng thái</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Đang hoạt động</option>
                    <option value="Used">Đã sử dụng</option>
                    <option value="Expired">Đã hết hạn</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Loại giảm giá <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleChange}
                  >
                    <option value="Percentage">Phần trăm (%)</option>
                    <option value="Fixed">Số tiền cố định (VNĐ)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Giá trị giảm{" "}
                    {formData.discountType === "Percentage" ? "(%)" : "(VNĐ)"}{" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    min="0"
                    max={formData.discountType === "Percentage" ? "100" : ""}
                    required
                    placeholder={
                      formData.discountType === "Percentage"
                        ? "VD: 20"
                        : "VD: 50000"
                    }
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Ngày bắt đầu <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    Ngày kết thúc <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="bg-light border-0">
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              type="submit"
              style={{ backgroundColor: "#a61e4d", border: "none" }}
            >
              <i className="bi bi-check-lg me-1"></i>
              {isEdit ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Xác nhận xóa */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger fw-bold">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Xác nhận xóa voucher
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa voucher{" "}
          <span className="fw-bold text-primary">{selectedVoucher?.voucherCode}</span>{" "}
          không? Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy bỏ
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            <i className="bi bi-trash me-1"></i>Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default VoucherList;
