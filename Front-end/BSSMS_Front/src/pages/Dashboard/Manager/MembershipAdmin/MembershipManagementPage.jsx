import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Spinner,
    Table,
} from "react-bootstrap";
import axios from "axios";

const API_BASE = "/api/membership-tiers";
const TRANSFER_API = `${API_BASE}/transfer`;

const emptyForm = {
    tierName: "",
    description: "",
    discountPercent: "0",
    minSpending: "0",
};

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));

const formatPercent = (value) =>
    `${Number(value ?? 0).toLocaleString("vi-VN")}%`;

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

const MembershipManagementPage = () => {
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pageError, setPageError] = useState("");
    const [message, setMessage] = useState("");

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [formError, setFormError] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingTier, setDeletingTier] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [sourceTierId, setSourceTierId] = useState("");
    const [targetTierId, setTargetTierId] = useState("");
    const [transferPreview, setTransferPreview] = useState(null);
    const [transferError, setTransferError] = useState("");
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);

    const loadTiers = useCallback(async () => {
        setIsLoading(true);
        setPageError("");

        try {
            const response = await axios.get(API_BASE, {
                withCredentials: true,
            });

            if (!Array.isArray(response.data)) {
                throw new Error("Dữ liệu hạng thành viên không hợp lệ.");
            }

            setTiers(response.data);
        } catch (error) {
            setPageError(
                getErrorMessage(
                    error,
                    "Không thể tải danh sách hạng thành viên."
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the view while synchronizing external data for this selection.
        loadTiers();
    }, [loadTiers]);

    const handleOpenCreate = () => {
        setEditingTier(null);
        setFormData({ ...emptyForm });
        setFormError("");
        setShowFormModal(true);
    };

    const handleOpenEdit = (tier) => {
        setEditingTier(tier);
        setFormData({
            tierName: tier.tierName || "",
            description: tier.description || "",
            discountPercent: String(tier.discountPercent ?? 0),
            minSpending: String(tier.minSpending ?? 0),
        });
        setFormError("");
        setShowFormModal(true);
    };

    const handleFormChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmitTier = async (event) => {
        event.preventDefault();
        setFormError("");
        setMessage("");

        const tierName = formData.tierName.trim();
        const discountPercent = Number(formData.discountPercent);
        const minSpending = Number(formData.minSpending);

        if (!tierName) {
            setFormError("Tên hạng thành viên không được để trống.");
            return;
        }

        if (
            formData.discountPercent.trim() === "" ||
            !Number.isFinite(discountPercent) ||
            discountPercent < 0 ||
            discountPercent > 100
        ) {
            setFormError("Mức giảm giá phải nằm trong khoảng 0–100%.");
            return;
        }

        if (
            formData.minSpending.trim() === "" ||
            !Number.isFinite(minSpending) ||
            minSpending < 0
        ) {
            setFormError("Mức chi tiêu tối thiểu phải lớn hơn hoặc bằng 0.");
            return;
        }

        const payload = {
            tierName,
            description: formData.description.trim(),
            discountPercent,
            minSpending,
        };

        setIsSaving(true);

        try {
            if (editingTier) {
                await axios.put(
                    `${API_BASE}?id=${editingTier.membershipTierId}`,
                    payload,
                    { withCredentials: true }
                );
                setMessage("Cập nhật hạng thành viên thành công.");
            } else {
                await axios.post(API_BASE, payload, {
                    withCredentials: true,
                });
                setMessage("Tạo hạng thành viên thành công.");
            }

            setShowFormModal(false);
            await loadTiers();
        } catch (error) {
            setFormError(
                getErrorMessage(error, "Không thể lưu hạng thành viên.")
            );
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenDelete = (tier) => {
        setDeletingTier(tier);
        setShowDeleteModal(true);
    };


    const handleDeleteTier = async () => {
        if (!deletingTier) return;

        setIsDeleting(true);
        setPageError("");
        setMessage("");

        try {
            await axios.delete(
                `${API_BASE}?id=${deletingTier.membershipTierId}`,
                { withCredentials: true }
            );

            setShowDeleteModal(false);
            setDeletingTier(null);
            setMessage("Xóa hạng thành viên thành công.");
            await loadTiers();
        } catch (error) {
            if (error.response?.status === 409) {
                setPageError(
                    "Không thể xóa hạng thành viên này vì vẫn còn khách hàng thuộc hạng. " +
                    "Vui lòng chuyển khách hàng sang hạng khác trước khi xóa."
                );
            } else {
                setPageError(
                    getErrorMessage(
                        error,
                        "Không thể xóa hạng thành viên."
                    )
                );
            }
            setShowDeleteModal(false);
        } finally {
            setIsDeleting(false);
        }
    };


    const handleOpenTransfer = () => {
        setSourceTierId("");
        setTargetTierId("");
        setTransferPreview(null);
        setTransferError("");
        setShowTransferModal(true);
    };

    const handlePreviewTransfer = async (event) => {
        event.preventDefault();
        setTransferError("");
        setTransferPreview(null);

        if (
            !sourceTierId ||
            !targetTierId ||
            sourceTierId === targetTierId
        ) {
            setTransferError(
                "Vui lòng chọn hai hạng thành viên khác nhau."
            );
            return;
        }

        setIsPreviewing(true);

        try {
            const response = await axios.get(TRANSFER_API, {
                params: {
                    sourceTierId,
                    targetTierId,
                },
                withCredentials: true,
            });

            setTransferPreview(response.data);
        } catch (error) {
            setTransferError(
                getErrorMessage(
                    error,
                    "Không thể xem trước việc chuyển khách hàng."
                )
            );
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleConfirmTransfer = async () => {
        if (!transferPreview) return;

        const sourceName = transferPreview.sourceTierName;
        const targetName = transferPreview.targetTierName;
        const customerCount = Number(transferPreview.customerCount ?? 0);

        const confirmed = window.confirm(
            `Bạn sắp chuyển ${customerCount} khách hàng từ "${sourceName}" sang "${targetName}".\n\nBạn có chắc chắn muốn tiếp tục không?`
        );

        if (!confirmed) return;

        setIsTransferring(true);
        setTransferError("");

        try {
            const response = await axios.post(
                TRANSFER_API,
                {
                    sourceTierId: Number(sourceTierId),
                    targetTierId: Number(targetTierId),
                },
                { withCredentials: true }
            );

            const transferred =
                response.data.transferredCustomers ?? customerCount;

            setShowTransferModal(false);
            setMessage(
                `Chuyển hạng thành công. Số khách hàng đã chuyển: ${transferred}.`
            );

            setTransferPreview(null);
            await loadTiers();
        } catch (error) {
            setTransferError(
                getErrorMessage(
                    error,
                    "Không thể chuyển khách hàng giữa các hạng."
                )
            );
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <Container fluid className="membership-management-page py-4 px-4">
            <div className="membership-management-heading mb-4">
                <div>
                    <h2 className="fw-bold mb-2">
                        Quản lý hạng thành viên
                    </h2>
                    <p className="text-muted mb-0">
                        Quản lý quyền lợi, điều kiện chi tiêu và phân hạng khách hàng.
                    </p>
                </div>

                <div className="d-flex flex-wrap gap-2">
                    <Button
                        variant="outline-danger"
                        onClick={handleOpenTransfer}
                        disabled={tiers.length < 2}
                    >
                        <i className="bi bi-arrow-left-right me-2"></i>
                        Chuyển khách hàng
                    </Button>

                    <Button variant="danger" onClick={handleOpenCreate}>
                        <i className="bi bi-plus-lg me-2"></i>
                        Thêm hạng
                    </Button>
                </div>
            </div>

            {message && (
                <Alert
                    variant="success"
                    dismissible
                    onClose={() => setMessage("")}
                >
                    {message}
                </Alert>
            )}

            {pageError && (
                <Alert
                    variant="danger"
                    dismissible
                    onClose={() => setPageError("")}
                >
                    {pageError}
                </Alert>
            )}

            <Row className="g-3 mb-4">
                <Col xs={12} md={4}>
                    <Card className="membership-summary-card h-100">
                        <Card.Body>
                            <div className="text-muted mb-2">
                                Tổng số hạng thành viên
                            </div>
                            <div className="membership-summary-number">
                                {tiers.length}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} md={4}>
                    <Card className="membership-summary-card h-100">
                        <Card.Body>
                            <div className="text-muted mb-2">
                                Mức giảm giá cao nhất
                            </div>
                            <div className="membership-summary-number">
                                {tiers.length
                                    ? formatPercent(
                                        Math.max(
                                            ...tiers.map((tier) =>
                                                Number(
                                                    tier.discountPercent ?? 0
                                                )
                                            )
                                        )
                                    )
                                    : "0%"}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} md={4}>
                    <Card className="membership-summary-card h-100">
                        <Card.Body>
                            <div className="text-muted mb-2">
                                Điều kiện chi tiêu cao nhất
                            </div>
                            <div className="membership-summary-number membership-summary-currency">
                                {formatCurrency(
                                    tiers.length
                                        ? Math.max(
                                            ...tiers.map((tier) =>
                                                Number(tier.minSpending ?? 0)
                                            )
                                        )
                                        : 0
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="membership-table-card border-0 shadow-sm">
                <Card.Header className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <h5 className="fw-bold mb-0">
                            <i className="bi bi-award me-2"></i>
                            Danh sách hạng
                        </h5>

                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={loadTiers}
                            disabled={isLoading}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Làm mới
                        </Button>
                    </div>
                </Card.Header>

                <Card.Body className="p-0">
                    {isLoading ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="danger" />
                            <p className="text-muted mt-3 mb-0">
                                Đang tải danh sách hạng...
                            </p>
                        </div>
                    ) : tiers.length === 0 ? (
                        <div className="text-center text-muted py-5">
                            <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                            Chưa có hạng thành viên nào.
                        </div>
                    ) : (
                        <Table responsive hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="membership-id-column">ID</th>
                                    <th>Tên hạng</th>
                                    <th>Giảm giá</th>
                                    <th>Chi tiêu tối thiểu</th>
                                    <th>Mô tả</th>
                                    <th className="text-center">Hành động</th>
                                </tr>
                            </thead>

                            <tbody>
                                {tiers.map((tier) => (
                                    <tr key={tier.membershipTierId}>
                                        <td>
                                            <Badge bg="secondary">
                                                {tier.membershipTierId}
                                            </Badge>
                                        </td>
                                        <td className="fw-semibold">
                                            {tier.tierName}
                                        </td>
                                        <td>
                                            <Badge bg="danger" className="membership-discount-badge">
                                                {formatPercent(tier.discountPercent)}
                                            </Badge>
                                        </td>
                                        <td className="text-nowrap">
                                            {formatCurrency(tier.minSpending)}
                                        </td>
                                        <td className="membership-description-cell">
                                            {tier.description || (
                                                <span className="text-muted">
                                                    Chưa có mô tả
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-center text-nowrap">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                title="Chỉnh sửa"
                                                onClick={() => handleOpenEdit(tier)}
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </Button>

                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                title="Xóa"
                                                onClick={() => handleOpenDelete(tier)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Modal thêm / chỉnh sửa */}
            <Modal
                show={showFormModal}
                onHide={() => !isSaving && setShowFormModal(false)}
                centered
                backdrop="static"
            >
                <Form onSubmit={handleSubmitTier}>
                    <Modal.Header closeButton={!isSaving}>
                        <Modal.Title className="fw-bold">
                            {editingTier ? "Chỉnh sửa hạng" : "Thêm hạng thành viên"}
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {formError && (
                            <Alert variant="danger">{formError}</Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>
                                Tên hạng <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                name="tierName"
                                value={formData.tierName}
                                onChange={handleFormChange}
                                maxLength={100}
                                required
                                placeholder="Ví dụ: Silver"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả quyền lợi</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Mô tả quyền lợi của hạng thành viên"
                            />
                        </Form.Group>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Giảm giá (%)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="discountPercent"
                                        value={formData.discountPercent}
                                        onChange={handleFormChange}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Giá trị từ 0 đến 100.
                                    </Form.Text>
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Chi tiêu tối thiểu (VND)
                                    </Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="minSpending"
                                        value={formData.minSpending}
                                        onChange={handleFormChange}
                                        min="0"
                                        step="1"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={() => setShowFormModal(false)}
                            disabled={isSaving}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="danger"
                            type="submit"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Đang lưu...
                                </>
                            ) : (
                                "Lưu thay đổi"
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal xác nhận xóa */}
            <Modal
                show={showDeleteModal}
                onHide={() => !isDeleting && setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton={!isDeleting}>
                    <Modal.Title className="fw-bold text-danger">
                        Xác nhận xóa hạng
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    Bạn có chắc chắn muốn xóa hạng{" "}
                    <strong>{deletingTier?.tierName}</strong> không?
                    <p className="text-muted small mt-2 mb-0">
                        Nếu còn khách hàng thuộc hạng này, hệ thống có thể từ chối xóa.
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={isDeleting}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteTier}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal xem trước và chuyển khách hàng */}
            <Modal
                show={showTransferModal}
                onHide={() => !isTransferring && setShowTransferModal(false)}
                centered
                backdrop="static"
            >
                <Modal.Header closeButton={!isTransferring}>
                    <Modal.Title className="fw-bold">
                        Chuyển khách hàng giữa các hạng
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {transferError && (
                        <Alert variant="danger">{transferError}</Alert>
                    )}

                    <Form onSubmit={handlePreviewTransfer}>
                        <Form.Group className="mb-3">
                            <Form.Label>Hạng nguồn</Form.Label>
                            <Form.Select
                                value={sourceTierId}
                                onChange={(event) => {
                                    setSourceTierId(event.target.value);
                                    setTransferPreview(null);
                                    setTransferError("");
                                }}
                                required
                                disabled={isPreviewing || isTransferring}
                            >
                                <option value="">-- Chọn hạng nguồn --</option>
                                {tiers.map((tier) => (
                                    <option
                                        key={tier.membershipTierId}
                                        value={tier.membershipTierId}
                                    >
                                        {tier.tierName}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Hạng đích</Form.Label>
                            <Form.Select
                                value={targetTierId}
                                onChange={(event) => {
                                    setTargetTierId(event.target.value);
                                    setTransferPreview(null);
                                    setTransferError("");
                                }}
                                required
                                disabled={isPreviewing || isTransferring}
                            >
                                <option value="">-- Chọn hạng đích --</option>
                                {tiers
                                    .filter(
                                        (tier) =>
                                            String(tier.membershipTierId) !==
                                            String(sourceTierId)
                                    )
                                    .map((tier) => (
                                        <option
                                            key={tier.membershipTierId}
                                            value={tier.membershipTierId}
                                        >
                                            {tier.tierName}
                                        </option>
                                    ))}
                            </Form.Select>
                        </Form.Group>

                        <Button
                            type="submit"
                            variant="outline-danger"
                            className="w-100"
                            disabled={isPreviewing || isTransferring}
                        >
                            {isPreviewing ? (
                                <>
                                    <Spinner size="sm" className="me-2" />
                                    Đang kiểm tra...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-search me-2"></i>
                                    Xem trước số khách hàng
                                </>
                            )}
                        </Button>
                    </Form>

                    {transferPreview && (
                        <Alert variant="warning" className="mt-4 mb-0">
                            <h6 className="fw-bold">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                Xác nhận thông tin chuyển
                            </h6>

                            <p className="mb-2">
                                Chuyển từ{" "}
                                <strong>{transferPreview.sourceTierName}</strong>
                                {" "}sang{" "}
                                <strong>{transferPreview.targetTierName}</strong>.
                            </p>

                            <div className="fs-5 fw-bold">
                                {transferPreview.customerCount} khách hàng
                            </div>

                            <p className="small mb-0 mt-2">
                                Chưa có dữ liệu nào được chuyển. Hãy bấm nút bên dưới
                                nếu bạn muốn thực hiện thao tác thật.
                            </p>
                        </Alert>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowTransferModal(false)}
                        disabled={isTransferring}
                    >
                        Đóng
                    </Button>

                    <Button
                        variant="danger"
                        onClick={handleConfirmTransfer}
                        disabled={
                            !transferPreview ||
                            isTransferring ||
                            isPreviewing
                        }
                    >
                        {isTransferring ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Đang chuyển...
                            </>
                        ) : (
                            "Xác nhận chuyển khách hàng"
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default MembershipManagementPage;
