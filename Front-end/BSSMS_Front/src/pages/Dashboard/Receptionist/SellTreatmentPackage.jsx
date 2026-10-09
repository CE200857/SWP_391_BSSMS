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
    Modal,
    Row,
    Col,
} from "react-bootstrap";

const SellTreatmentPackage = () => {
    const [packages, setPackages] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [showSellModal, setShowSellModal] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const canSell = ["Receptionist", "Manager"].includes(user?.role);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        setLoadError("");
        try {
            const [packageRes, customerRes] = await Promise.all([
                fetch("/api/treatment-packages"),
                fetch("/api/customers"),
            ]);

            const packageData = packageRes.ok ? await packageRes.json() : [];
            const customerData = customerRes.ok ? await customerRes.json() : [];

            setPackages(Array.isArray(packageData) ? packageData : []);
            setCustomers(Array.isArray(customerData) ? customerData : []);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setLoadError("Không thể tải dữ liệu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenSellModal = (pkg) => {
        setSelectedPackage(pkg);
        setSelectedCustomerId("");
        setShowSellModal(true);
    };

    const handleSellPackage = async () => {
        if (!selectedPackage || !selectedCustomerId) {
            alert("Vui lòng chọn khách hàng!");
            return;
        }

        setIsSubmitting(true);
        setSuccessMsg("");

        try {
            const response = await fetch("/api/customer-packages/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerId: parseInt(selectedCustomerId, 10),
                    treatmentPackageId: selectedPackage.treatmentPackageId,
                    expiryMonths: 12,
                }),
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setSuccessMsg(`Bán gói liệu trình thành công! Mã gói: #${data.customerPackageId || selectedPackage.treatmentPackageId}`);
                setShowSellModal(false);
                setSelectedPackage(null);
                setTimeout(() => setSuccessMsg(""), 5000);
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.message || "Bán gói liệu trình thất bại!");
            }
        } catch (err) {
            console.error("Lỗi bán gói:", err);
            alert("Lỗi kết nối đến máy chủ!");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPackages = packages.filter((pkg) => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !search ||
            pkg.packageName?.toLowerCase().includes(search) ||
            pkg.description?.toLowerCase().includes(search) ||
            String(pkg.treatmentPackageId).includes(search);
        return matchesSearch;
    });

    const formatCurrency = (amount) => {
        return Number(amount).toLocaleString("vi-VN");
    };

    if (!canSell) {
        return (
            <Container className="mt-4 px-4">
                <Alert variant="warning">
                    Bạn không có quyền truy cập trang này. Chỉ Lễ tân hoặc Quản lý mới có thể bán gói liệu trình.
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
            <h2 className="fw-bold text-uppercase mb-4">Bán gói liệu trình</h2>

            {successMsg && (
                <Alert variant="success" className="mb-4" onClose={() => setSuccessMsg("")} dismissible>
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {successMsg}
                </Alert>
            )}
            {loadError && <Alert variant="danger">{loadError}</Alert>}

            {/* Bộ lọc */}
            <Card className="shadow-sm border-0 mb-4" style={{ borderRadius: "12px" }}>
                <Card.Body>
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <InputGroup style={{ maxWidth: "400px" }}>
                            <InputGroup.Text>
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                placeholder="Tìm theo tên gói, mô tả..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </InputGroup>
                    </div>
                </Card.Body>
            </Card>

            {/* Bảng danh sách gói liệu trình */}
            <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
                <Card.Body className="p-0">
                    <Table striped bordered hover responsive className="align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Tên gói</th>
                                <th>Mô tả</th>
                                <th>Dịch vụ</th>
                                <th>Số buổi</th>
                                <th>Giá (VNĐ)</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages.length > 0 ? (
                                filteredPackages.map((pkg) => (
                                    <tr key={pkg.treatmentPackageId}>
                                        <td>{pkg.treatmentPackageId}</td>
                                        <td className="fw-semibold">{pkg.packageName}</td>
                                        <td>
                                            <span
                                                style={{
                                                    maxWidth: "250px",
                                                    display: "block",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                }}
                                                title={pkg.description}
                                            >
                                                {pkg.description || "—"}
                                            </span>
                                        </td>
                                        <td>{pkg.serviceName || pkg.serviceId || "—"}</td>
                                        <td>
                                            <Badge bg="primary">{pkg.numberOfSessions} buổi</Badge>
                                        </td>
                                        <td className="text-danger fw-bold">
                                            {formatCurrency(pkg.price)}
                                        </td>
                                        <td>
                                            <Badge bg={pkg.status === "Active" ? "success" : "secondary"}>
                                                {pkg.status === "Active" ? "Đang bán" : pkg.status}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleOpenSellModal(pkg)}
                                            >
                                                <i className="bi bi-cart-plus me-1"></i>
                                                Bán
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-4">
                                        Không tìm thấy gói liệu trình nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Modal bán gói liệu trình */}
            <Modal show={showSellModal} onHide={() => setShowSellModal(false)} centered size="lg">
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>
                        <i className="bi bi-cart-plus me-2"></i>
                        Bán gói liệu trình
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPackage && (
                        <>
                            {/* Thông tin gói */}
                            <Card className="bg-light border-0 mb-4">
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-1">
                                                <strong>Tên gói:</strong> {selectedPackage.packageName}
                                            </p>
                                            <p className="mb-1">
                                                <strong>Số buổi:</strong> {selectedPackage.numberOfSessions} buổi
                                            </p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-1">
                                                <strong>Giá:</strong>{" "}
                                                <span className="text-danger fw-bold">
                                                    {formatCurrency(selectedPackage.price)} VNĐ
                                                </span>
                                            </p>
                                            <p className="mb-1">
                                                <strong>Mô tả:</strong>{" "}
                                                {selectedPackage.description || "—"}
                                            </p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Chọn khách hàng */}
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">
                                    Chọn khách hàng <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={selectedCustomerId}
                                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                                >
                                    <option value="">-- Chọn khách hàng --</option>
                                    {customers.map((c) => (
                                        <option key={c.customerId} value={c.customerId}>
                                            {c.fullName || c.customerName} 
                                            {c.phone ? ` - ${c.phone}` : ""}
                                            {c.email ? ` (${c.email})` : ""}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    Danh sách khách hàng đã đăng ký trong hệ thống.
                                </Form.Text>
                            </Form.Group>

                            {/* Thông tin thanh toán */}
                            <Card className="border-warning">
                                <Card.Header className="bg-warning text-dark fw-bold">
                                    <i className="bi bi-receipt me-2"></i>
                                    Thông tin thanh toán
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p className="mb-1">
                                                <strong>Tổng tiền:</strong>
                                            </p>
                                            <h4 className="text-danger fw-bold">
                                                {formatCurrency(selectedPackage.price)} VNĐ
                                            </h4>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label className="fw-bold">Phương thức thanh toán</Form.Label>
                                                <Form.Select defaultValue="Cash">
                                                    <option value="Cash">Tiền mặt</option>
                                                    <option value="BankTransfer">Chuyển khoản</option>
                                                    <option value="CreditCard">Thẻ</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSellModal(false)}>
                        Hủy bỏ
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleSellPackage}
                        disabled={isSubmitting || !selectedCustomerId}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" /> Đang xử lý...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-circle me-1"></i>
                                Xác nhận bán
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default SellTreatmentPackage;
