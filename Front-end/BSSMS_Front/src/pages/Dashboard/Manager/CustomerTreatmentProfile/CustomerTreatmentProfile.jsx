import { useState, useEffect, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Form,
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
import servicePhoto01 from "../../../../assets/figma/service-card-exact-01.png";
import { useManagerSearchFilter } from "../../../../components/ManagerSearchFilter";

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
  const [treatmentPackages, setTreatmentPackages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const storedUser = localStorage.getItem("user");
  const user = useMemo(() => storedUser ? JSON.parse(storedUser) : null, [storedUser]);
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
      setError("");
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

        if (targetCustomerId || canViewAll) {
          try {
            const treatmentPackageRes = await axios.get(
              "/api/treatment-packages",
              { withCredentials: true },
            );
            setTreatmentPackages(
              Array.isArray(treatmentPackageRes.data)
                ? treatmentPackageRes.data
                : [],
            );
          } catch (err) {
            console.warn("Không tải được danh mục gói liệu trình:", err);
            setTreatmentPackages([]);
          }

          // Lấy thông tin khách hàng
          try {
            if (!targetCustomerId) { setCustomerInfo(null); } else {
            const infoRes = await axios.get(
              `/api/customers?id=${targetCustomerId}`,
              { withCredentials: true }
            );
            setCustomerInfo(infoRes.data); }
          } catch (err) {
            console.warn("Không tải được thông tin khách hàng:", err);
            setCustomerInfo(null);
          }

          // Lấy danh sách gói liệu trình đã mua (CustomerPackageServlet hỗ trợ ?customerId=X)
          try {
            const packageRes = await axios.get(
              `/api/customer-packages${targetCustomerId ? `?customerId=${targetCustomerId}` : ""}`,
              { withCredentials: true }
            );
            const pkgList = Array.isArray(packageRes.data)
              ? packageRes.data
              : [];
            setPackages(pkgList);
          } catch (err) {
            console.warn("Không tải được danh sách gói liệu trình:", err);
            setError("Không tải được danh sách gói liệu trình.");
            setPackages([]);
          }

          // Lấy hồ sơ điều trị (TreatmentProfileServlet)
          try {
            const profileRes = await axios.get(
              `/api/treatment-profiles${targetCustomerId ? `?customerId=${targetCustomerId}` : ""}`,
              { withCredentials: true }
            );
            const profileList = Array.isArray(profileRes.data)
              ? profileRes.data
              : [];
            setAppointments(profileList);
          } catch (err) {
            console.warn("Không tải được hồ sơ điều trị:", err);
            setError("Không tải được hồ sơ điều trị. Vui lòng kiểm tra kết nối API.");
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
    } else { navigate("/my-treatment-profile"); }
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

  const getPackageAppointments = (pkg) =>
    appointments
      .filter(
        (appointment) =>
          String(appointment.customerPackageId) === String(pkg.customerPackageId),
      )
      .sort((first, second) => {
        const firstDate = `${first.appointmentDate || ""}T${first.startTime || ""}`;
        const secondDate = `${second.appointmentDate || ""}T${second.startTime || ""}`;
        return secondDate.localeCompare(firstDate);
      });

  const getPackageUsageStats = (pkg) => {
    const packageAppointments = getPackageAppointments(pkg);
    const recordedUsageCount = packageAppointments.filter(
      (appointment) => appointment.packageUsageId != null,
    ).length;
    const catalogPackage = treatmentPackages.find(
      (item) =>
        String(item.treatmentPackageId) === String(pkg.treatmentPackageId),
    );
    const configuredSessionCount =
      pkg.numberOfSessions ?? catalogPackage?.numberOfSessions;
    const hasConfiguredSessionCount =
      configuredSessionCount != null &&
      Number.isFinite(Number(configuredSessionCount)) &&
      Number.isFinite(Number(pkg.remainingSessions));
    const balanceUsedCount = hasConfiguredSessionCount
      ? Math.max(0, Number(configuredSessionCount) - Number(pkg.remainingSessions))
      : null;

    return {
      appointments: packageAppointments,
      recordedUsageCount,
      balanceUsedCount,
      totalSessionCount: hasConfiguredSessionCount
        ? Number(configuredSessionCount)
        : null,
      missingHistoryCount: hasConfiguredSessionCount
        ? Math.max(0, balanceUsedCount - recordedUsageCount)
        : 0,
      inconsistentCount: hasConfiguredSessionCount
        ? Math.max(0, recordedUsageCount - balanceUsedCount)
        : 0,
    };
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
      case "Pending":
        return <Badge bg="info">Chờ xác nhận</Badge>;
      case "Confirmed":
        return <Badge bg="info">Đã xác nhận</Badge>;
      case "Checked-in":
        return <Badge bg="primary">Đã check-in</Badge>;
      case "In-progress":
        return <Badge bg="warning" text="dark">Đang điều trị</Badge>;
      case "Completed":
        return <Badge bg="success">Hoàn thành</Badge>;
      case "Cancelled":
        return <Badge bg="danger">Đã hủy</Badge>;
      case "No-show":
        return <Badge bg="secondary">Không đến</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const packageFilters = useManagerSearchFilter(
    packages,
    [
      { key: "customerPackageId", label: "Mã gói", filterable: false },
      { key: "packageName", label: "Gói liệu trình", filterable: false },
      { key: "serviceName", label: "Dịch vụ" },
      { key: "status", label: "Trạng thái" },
      { key: "customerName", label: "Khách hàng", filterable: false },
      { key: "expiryDate", label: "Ngày hết hạn", type: "date" },
    ],
    "Tìm theo tên gói hoặc dịch vụ...",
  );
  const appointmentFilters = useManagerSearchFilter(
    appointments,
    [
      { key: "appointmentId", label: "Mã lịch hẹn", filterable: false },
      { key: "customerName", label: "Khách hàng", filterable: false },
      { key: "serviceName", label: "Dịch vụ", filterable: false },
      { key: "packageName", label: "Gói liệu trình", filterable: false },
      {
        key: "purchaseType",
        label: "Hình thức",
        getValue: (appointment) =>
          appointment.customerPackageId != null ? "package" : "single",
        formatValue: (value) => value === "package" ? "Dùng gói" : "Mua lẻ",
      },
      {
        key: "sessionUsage",
        label: "Trừ buổi",
        getValue: (appointment) => {
          if (appointment.customerPackageId == null) return "not-applicable";
          if (appointment.packageUsageId != null) return "deducted";
          return appointment.appointmentStatus === "Completed"
            ? "needs-review"
            : "not-recorded";
        },
        formatValue: (value) => ({
          deducted: "Đã trừ buổi",
          "needs-review": "Cần kiểm tra trừ buổi",
          "not-recorded": "Chưa ghi nhận trừ buổi",
          "not-applicable": "Không áp dụng",
        })[value],
      },
      {
        key: "invoiceStatus",
        label: "Thanh toán",
        getValue: (appointment) => appointment.invoiceStatus || "no-invoice",
        formatValue: (value) => ({
          Paid: "Đã thanh toán",
          Unpaid: "Chưa thanh toán",
          "no-invoice": "Chưa có hóa đơn",
        })[value] || value,
      },
      { key: "appointmentDate", label: "Ngày thực hiện", type: "date" },
    ],
    "Tìm theo khách hàng, dịch vụ hoặc gói...",
  );
  const packageAppointments = appointments.filter(
    (appointment) => appointment.customerPackageId != null,
  );
  const singleAppointments = appointments.length - packageAppointments.length;
  const recordedPackageUsageCount = appointments.filter(
    (appointment) => appointment.packageUsageId != null,
  ).length;
  const packageUsageReviewCount = appointments.filter(
    (appointment) =>
      appointment.customerPackageId != null &&
      appointment.appointmentStatus === "Completed" &&
      appointment.packageUsageId == null,
  ).length;

  return (
    <div className={isCustomer ? "public-service-page customer-treatment-page" : "customer-treatment-staff-page"}>
      {isCustomer && (
        <section className="public-service-hero customer-treatment-hero">
          <div className="public-service-hero-copy">
            <span className="seoul-eyebrow">HÀNH TRÌNH CHĂM SÓC CỦA BẠN</span>
            <h1>Hồ sơ liệu trình</h1>
            <p>
              Xem các gói liệu trình đã mua, số buổi còn lại và lịch sử chăm sóc
              của bạn tại Seoul Center.
            </p>
            <span className="public-service-hero-note">
              <i className="bi bi-heart" aria-hidden="true" /> Theo dõi hành trình chăm sóc của bạn
            </span>
          </div>
          <img src={servicePhoto01} alt="Chăm sóc da tại Seoul Center" />
        </section>
      )}

      <section className={isCustomer ? "public-service-content customer-treatment-content" : "container-fluid mt-4 px-4"}>
        {!isCustomer && (
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="manager-page-title fw-bold mb-1">
                Hồ sơ liệu trình
              </h2>
              <p className="text-muted mb-0">
                Xem và quản lý các gói liệu trình đã mua
              </p>
            </div>
          </div>
        )}

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
                    <option value="">Tất cả khách hàng</option>
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
        <Card className="border-0 shadow-sm mb-4 customer-treatment-customer-card">
          <Card.Body>
            <Row>
              <Col md={3} className="text-center">
                <div
                  className="customer-treatment-avatar rounded-circle d-inline-flex align-items-center justify-content-center text-white"
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
      <Tabs defaultActiveKey="packages" className={`mb-3${isCustomer ? " customer-treatment-tabs" : ""}`}>
        <Tab eventKey="packages" title={
          <span>
            <i className="bi bi-box2-heart me-2"></i>
            Gói liệu trình ({packages.length})
          </span>
        }>
          <Card className={`border-0 shadow-sm${isCustomer ? " customer-treatment-search-card" : ""}`}>
            <Card.Body>
              <div className="manager-list-toolbar">{packageFilters.toolbar}</div>
            </Card.Body>
          </Card>

          <Card className={`border-0 shadow-sm${isCustomer ? " customer-treatment-data-card" : ""}`}>
            <Card.Body className="p-0">
              <Table striped={!isCustomer} bordered={!isCustomer} hover responsive className={`align-middle mb-0${isCustomer ? " customer-treatment-table" : ""}`}>
                <thead className={isCustomer ? "" : "table-dark"}>
                  <tr>
                    <th>ID</th>
                    <th>Gói liệu trình / Khách hàng</th>
                    <th>Ngày mua</th>
                    <th>Buổi còn lại</th>
                    <th>Ngày hết hạn</th>
                    <th>Trạng thái</th>
                    {canEdit && <th className="text-center">Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {packageFilters.filteredRows.length > 0 ? (
                    packageFilters.filteredRows.map((p) => (
                      <tr key={p.customerPackageId}>
                        <td className="fw-bold">#{p.customerPackageId}</td>
                        <td>
                          <strong>{p.packageName || `Gói #${p.treatmentPackageId}`}</strong><small className="d-block">{p.customerName || `Khách hàng #${p.customerId}`}</small>
                        </td>
                        <td>{formatDate(p.purchaseDate)}</td>
                        <td>
                          <Badge bg={p.remainingSessions > 0 ? "success" : "secondary"}>
                            {p.remainingSessions}
                            {p.numberOfSessions ? ` / ${p.numberOfSessions}` : ""} buổi
                          </Badge>
                          {(() => {
                            const usage = getPackageUsageStats(p);
                            return (
                              <small className={`d-block mt-1${usage.missingHistoryCount ? " text-warning-emphasis" : " text-muted"}`}>
                                {usage.balanceUsedCount == null
                                  ? `${usage.recordedUsageCount} lượt có lịch sử`
                                  : `${usage.balanceUsedCount} buổi đã trừ`}
                                {usage.missingHistoryCount > 0 &&
                                  ` · thiếu ${usage.missingHistoryCount} lịch sử`}
                              </small>
                            );
                          })()}
                        </td>
                        <td>{formatDate(p.expiryDate)}</td>
                        <td>{getStatusBadge(p.status)}</td>
                        {canEdit && (
                          <td className="text-center">
                            <div className="manager-list-actions">
                            <Button
                              variant="link"
                              size="sm"
                              className="manager-list-action manager-list-action--view"
                              onClick={() => handleViewDetails(p)}
                            >
                              <i className="bi bi-eye" aria-hidden="true"></i>
                              Xem
                            </Button>
                            <Button
                              variant="link"
                              size="sm"
                              className="manager-list-action manager-list-action--edit"
                              onClick={() => handleOpenEdit(p)}
                            >
                              <i className="bi bi-pencil-square"></i> Sửa
                            </Button>
                            </div>
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
            Lịch hẹn & thanh toán ({appointments.length})
          </span>
        }>
          <div className="treatment-history-summary" aria-label="Tổng quan lịch hẹn và sử dụng gói">
            {[
              ["Mua lẻ", singleAppointments, "bi-receipt", "single"],
              ["Dùng gói", packageAppointments.length, "bi-box2-heart", "package"],
              ["Đã ghi nhận trừ buổi", recordedPackageUsageCount, "bi-check2-circle", "used"],
              ["Cần kiểm tra", packageUsageReviewCount, "bi-exclamation-circle", "review"],
            ].map(([label, count, icon]) => (
              <div className={`treatment-history-stat treatment-history-stat--${icon}`} key={label}>
                <span className="treatment-history-stat-icon">
                  <i className={`bi ${icon}`} aria-hidden="true" />
                </span>
                <span className="treatment-history-stat-copy">
                  <span>{label}</span>
                  <strong>{count}</strong>
                </span>
              </div>
            ))}
          </div>
          <div className="manager-list-toolbar mb-3">{appointmentFilters.toolbar}</div>
          <Card className={`border-0 shadow-sm${isCustomer ? " customer-treatment-data-card" : ""}`}>
            <Card.Body className="p-0">
              <Table striped={!isCustomer} bordered={!isCustomer} hover responsive className={`align-middle mb-0 treatment-history-table${isCustomer ? " customer-treatment-table" : ""}`}>
                <thead className={isCustomer ? "" : "table-dark"}>
                  <tr>
                    <th>Lịch hẹn</th>
                    {canViewAll && <th>Khách hàng</th>}
                    <th>Dịch vụ</th>
                    <th>Hình thức &amp; sử dụng</th>
                    {canViewAll && <th>Nhân viên</th>}
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentFilters.filteredRows.length > 0 ? (
                    appointmentFilters.filteredRows.map((a) => (
                      <tr key={a.appointmentId}>
                        <td>
                          <strong className="treatment-history-appointment-id">#{a.appointmentId}</strong>
                          <span className="treatment-history-secondary">
                            {formatDate(a.appointmentDate)}
                            {a.startTime ? ` · ${a.startTime.substring(0, 5)}` : ""}
                          </span>
                        </td>
                        {canViewAll && <td>{a.customerName || "-"}</td>}
                        <td>
                          <strong>{a.serviceName || "-"}</strong>
                          {a.rating > 0 && (
                            <span className="treatment-history-rating" aria-label={`Đánh giá ${a.rating} trên 5 sao`}>
                              <i className="bi bi-star-fill" aria-hidden="true" />
                              {a.rating}/5
                            </span>
                          )}
                        </td>
                        <td>
                          {a.customerPackageId != null ? (
                            <div className="treatment-history-usage">
                              <span className="treatment-history-chip treatment-history-chip--package">
                                <i className="bi bi-box2-heart" aria-hidden="true" />
                                Dùng gói
                              </span>
                              <span className="treatment-history-secondary">
                                {a.packageName || "Gói liệu trình"}
                                {` · #${a.customerPackageId}`}
                              </span>
                              {a.packageUsageId != null ? (
                                <span className="treatment-history-usage-detail treatment-history-usage-detail--success">
                                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                                  Đã trừ 1 buổi
                                  <small>
                                    Còn {a.remainingSessions ?? 0}
                                    {a.numberOfSessions != null ? `/${a.numberOfSessions}` : ""} buổi
                                  </small>
                                </span>
                              ) : (
                                <span className={`treatment-history-usage-detail${a.appointmentStatus === "Completed" ? " treatment-history-usage-detail--warning" : ""}`}>
                                  <i className={`bi ${a.appointmentStatus === "Completed" ? "bi-exclamation-circle-fill" : "bi-hourglass-split"}`} aria-hidden="true" />
                                  {a.appointmentStatus === "Completed"
                                    ? "Cần kiểm tra lượt trừ"
                                    : "Chưa trừ buổi"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="treatment-history-usage">
                              <span className="treatment-history-chip treatment-history-chip--single">
                                <i className="bi bi-receipt" aria-hidden="true" />
                                Mua lẻ
                              </span>
                              <span className={`treatment-history-usage-detail${a.invoiceStatus === "Paid" ? " treatment-history-usage-detail--success" : a.invoiceStatus === "Unpaid" ? " treatment-history-usage-detail--warning" : ""}`}>
                                <i className={`bi ${a.invoiceStatus === "Paid" ? "bi-check-circle-fill" : a.invoiceStatus === "Unpaid" ? "bi-clock-fill" : "bi-info-circle"}`} aria-hidden="true" />
                                {a.invoiceId != null
                                  ? `HĐ #${a.invoiceId} · ${a.invoiceStatus === "Paid" ? "Đã thanh toán" : a.invoiceStatus === "Unpaid" ? "Chưa thanh toán" : a.invoiceStatus}`
                                  : a.appointmentStatus === "Completed"
                                    ? "Chưa lập hóa đơn"
                                    : "Thanh toán sau dịch vụ"}
                              </span>
                            </div>
                          )}
                        </td>
                        {canViewAll && <td>{a.staffName || "-"}</td>}
                        <td>{getAppointmentStatusBadge(a.appointmentStatus)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={canViewAll ? "6" : "4"} className="text-center py-4 text-muted">
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
      </section>

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
            Chi tiết gói liệu trình
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPackage && (
          <>
            {(() => {
              const usage = getPackageUsageStats(selectedPackage);
              return (
                <>
            <Row className="g-3 mb-4">
              <Col md={6}>
                <p className="mb-2"><strong>Gói:</strong> {selectedPackage.packageName}</p>
                <p className="mb-2"><strong>Mã hồ sơ:</strong> #{selectedPackage.customerPackageId}</p>
                <p className="mb-2"><strong>Khách hàng:</strong> {selectedPackage.customerName || `#${selectedPackage.customerId}`}</p>
                <p className="mb-0"><strong>Ngày mua:</strong> {formatDate(selectedPackage.purchaseDate)}</p>
              </Col>
              <Col md={6}>
                <p className="mb-2">
                  <strong>Số buổi:</strong>{" "}
                  {usage.totalSessionCount != null && usage.balanceUsedCount != null
                    ? `${usage.balanceUsedCount} đã trừ / ${usage.totalSessionCount}`
                    : `${usage.recordedUsageCount} lượt có lịch sử`}
                </p>
                <p className="mb-2">
                  <strong>Còn lại:</strong>{" "}
                  <Badge bg={selectedPackage.remainingSessions > 0 ? "success" : "secondary"}>
                    {selectedPackage.remainingSessions} buổi
                  </Badge>
                </p>
                <p className="mb-2"><strong>Ngày hết hạn:</strong> {formatDate(selectedPackage.expiryDate)}</p>
                <p className="mb-0"><strong>Trạng thái:</strong> {getStatusBadge(selectedPackage.status)}</p>
              </Col>
            </Row>

            <section className="treatment-package-session-history">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div>
                  <h3 className="h6 fw-bold mb-1">Lịch sử sử dụng gói</h3>
                  <p className="small text-muted mb-0">
                    Các cuộc hẹn được đặt bằng gói này
                  </p>
                </div>
                <Badge bg="light" text="dark">
                  {usage.recordedUsageCount} lượt ghi nhận
                </Badge>
              </div>
              {usage.missingHistoryCount > 0 && (
                <Alert variant="warning" className="mb-3">
                  Số dư cho thấy đã trừ {usage.balanceUsedCount} buổi, nhưng hệ thống chỉ tìm thấy{" "}
                  {usage.recordedUsageCount} lượt có lịch sử. Còn thiếu {usage.missingHistoryCount} lượt để đối soát.
                  Không có đủ dữ liệu để xác định ngày hoặc cuộc hẹn của các lượt này.
                </Alert>
              )}
              {usage.inconsistentCount > 0 && (
                <Alert variant="danger" className="mb-3">
                  Lịch sử có {usage.recordedUsageCount} lượt trừ buổi nhưng số dư chỉ phản ánh{" "}
                  {usage.balanceUsedCount} buổi đã trừ. Vui lòng kiểm tra dữ liệu gói.
                </Alert>
              )}
              {usage.appointments.length > 0 ? (
                <div className="treatment-package-session-list">
                  {usage.appointments.map((appointment) => (
                    <article className="treatment-package-session-item" key={appointment.appointmentId}>
                      <span className={`treatment-package-session-icon${appointment.packageUsageId != null ? " is-used" : ""}`}>
                        <i
                          className={`bi ${appointment.packageUsageId != null ? "bi-check-lg" : "bi-calendar-event"}`}
                          aria-hidden="true"
                        />
                      </span>
                      <div className="treatment-package-session-copy">
                        <strong>{appointment.serviceName || "Buổi điều trị"}</strong>
                        <span>
                          #{appointment.appointmentId} · {formatDate(appointment.appointmentDate)}
                          {appointment.startTime ? ` · ${appointment.startTime.substring(0, 5)}` : ""}
                          {appointment.staffName ? ` · ${appointment.staffName}` : ""}
                        </span>
                      </div>
                      <span className={`treatment-package-session-status${appointment.packageUsageId != null ? " is-used" : ""}`}>
                        {appointment.packageUsageId != null
                          ? "Đã trừ buổi"
                          : appointment.appointmentStatus === "Completed"
                            ? "Cần kiểm tra"
                            : "Chưa sử dụng"}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="treatment-package-session-empty">
                  {usage.missingHistoryCount > 0
                    ? `Chưa có lịch hẹn nào được liên kết với gói này; còn ${usage.missingHistoryCount} lượt đã trừ cần đối soát.`
                    : "Chưa có lịch hẹn nào sử dụng gói này."}
                </div>
              )}
            </section>
              </>
            );
          })()}
          </>
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
    </div>
  );
};

export default CustomerTreatmentProfile;
