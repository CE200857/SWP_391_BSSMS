import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Form, Modal, Col, Row, Alert, Badge } from 'react-bootstrap';
import { api, post, put, del, money, label } from '../../../../services/api';
import { useManagerSearchFilter } from '../../../../components/ManagerSearchFilter';

const emptyForm = { treatmentPackageId: 0, packageName: '', description: '', price: '', numberOfSessions: '', validityDays: 180, status: 'Active', serviceIds: [] };

const TreatmentPackageList = () => {
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isManager = user?.role === 'Manager';
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [error, setError] = useState('');
    const [formError, setFormError] = useState('');
    const [notice, setNotice] = useState('');
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        try {
            const [pkgs, srvs] = await Promise.all([api('/api/treatment-packages'), api('/api/service')]);
            setPackages(isManager ? pkgs : pkgs.filter((p) => p.status === 'Active'));
            setServices(srvs.filter((s) => s.status === 'Active'));
        } catch (e) {
            setError(e.message);
        }
    }, [isManager]);
    useEffect(() => { load(); }, [load]);

    const { filteredRows: filteredPackages, toolbar } = useManagerSearchFilter(
        packages,
        [
            { key: 'packageName', label: 'Tên gói', filterable: false },
            { key: 'services', label: 'Dịch vụ', filterable: false, getValue: (p) => (p.services || []).map((s) => s.serviceName).join(', ') },
            { key: 'status', label: 'Trạng thái', formatValue: label },
        ],
        'Tìm theo tên gói hoặc dịch vụ...'
    );

    const open = (pkg) => {
        setFormError('');
        setFormData(pkg ? { ...emptyForm, ...pkg, serviceIds: [...(pkg.serviceIds || [])] } : emptyForm);
        setShowModal(true);
    };
    const toggleService = (id) => setFormData((f) => ({
        ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.serviceIds.length) return setFormError('Chọn ít nhất một dịch vụ áp dụng.');
        setSaving(true);
        setFormError('');
        const body = {
            treatmentPackageId: formData.treatmentPackageId, packageName: formData.packageName.trim(), description: formData.description?.trim() || null,
            price: Number(formData.price), numberOfSessions: Number(formData.numberOfSessions), validityDays: Number(formData.validityDays),
            status: formData.status, serviceIds: formData.serviceIds,
        };
        try {
            const r = formData.treatmentPackageId ? await put('/api/treatment-packages', body) : await post('/api/treatment-packages', body);
            setNotice(r?.message || 'Đã lưu gói liệu trình.');
            setShowModal(false);
            load();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Ngừng kinh doanh gói "${p.packageName}"? Khách đã mua vẫn sử dụng được đến hết hạn.`)) return;
        try {
            const r = await del(`/api/treatment-packages?id=${p.treatmentPackageId}`);
            setNotice(r?.message);
            load();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="manager-page-title fw-bold">Quản lý gói liệu trình</h2>
                {isManager && (
                    <Button variant="primary" className="fw-bold" onClick={() => open(null)}>
                        <i className="bi bi-plus-lg me-1"></i> Thêm gói mới
                    </Button>
                )}
            </div>
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {notice && <Alert variant="success" dismissible onClose={() => setNotice('')}>{notice}</Alert>}

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body><div className="manager-list-toolbar">{toolbar}</div></Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="align-middle mb-0 manager-list-table">
                        <thead className="table-dark">
                            <tr>
                                <th>Tên gói</th>
                                <th>Dịch vụ áp dụng</th>
                                <th>Số buổi</th>
                                <th>Hạn dùng</th>
                                <th>Giá trọn gói</th>
                                {isManager && <th>Đang sử dụng</th>}
                                <th>Trạng thái</th>
                                {isManager && <th className="text-center">Hành động</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages.length > 0 ? filteredPackages.map((p) => (
                                <tr key={p.treatmentPackageId}>
                                    <td className="text-primary fw-bold">{p.packageName}<small className="d-block text-muted fw-normal">{p.description}</small></td>
                                    <td>{(p.services || []).map((s) => <Badge key={s.serviceId} bg="info" className="me-1 mb-1">{s.serviceName}</Badge>)}</td>
                                    <td>{p.numberOfSessions} buổi</td>
                                    <td>{p.validityDays} ngày</td>
                                    <td className="text-danger fw-bold">{money(p.price)}</td>
                                    {isManager && <td>{p.customerCount} khách</td>}
                                    <td><Badge bg={p.status === 'Active' ? 'success' : 'secondary'}>{label(p.status)}</Badge></td>
                                    {isManager && (
                                        <td className="text-center">
                                            <div className="manager-list-actions">
                                                <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => open(p)}>
                                                    <i className="bi bi-pencil-square"></i> Sửa
                                                </Button>
                                                {p.status === 'Active' && (
                                                    <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => handleDelete(p)}>
                                                        <i className="bi bi-slash-circle"></i> Ngừng bán
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr><td colSpan={8} className="text-center py-4 text-muted">Chưa có gói liệu trình nào.</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => !saving && setShowModal(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold">{formData.treatmentPackageId ? 'Cập nhật gói liệu trình' : 'Thêm gói liệu trình'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        {formError && <Alert variant="danger">{formError}</Alert>}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Tên gói liệu trình*</Form.Label>
                            <Form.Control maxLength={150} value={formData.packageName} onChange={(e) => setFormData({ ...formData, packageName: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Dịch vụ áp dụng* <small className="text-muted fw-normal">(mỗi buổi dùng cho một trong các dịch vụ này)</small></Form.Label>
                            <div className="d-flex flex-wrap gap-3 border rounded p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                {services.map((s) => (
                                    <Form.Check key={s.serviceId} id={`pkg-svc-${s.serviceId}`} label={`${s.serviceName} (${money(s.price)})`}
                                        checked={formData.serviceIds.includes(s.serviceId)} onChange={() => toggleService(s.serviceId)} />
                                ))}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Mô tả chi tiết</Form.Label>
                            <Form.Control as="textarea" rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </Form.Group>
                        <Row>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Số buổi*</Form.Label>
                                <Form.Control type="number" min="1" max="100" value={formData.numberOfSessions} onChange={(e) => setFormData({ ...formData, numberOfSessions: e.target.value })} required /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Hạn dùng (ngày)*</Form.Label>
                                <Form.Control type="number" min="1" max="1095" value={formData.validityDays} onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })} required /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Giá trọn gói (VNĐ)*</Form.Label>
                                <Form.Control type="number" min="1000" step="1000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Trạng thái</Form.Label>
                                <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Đang bán</option><option value="Inactive">Ngừng bán</option>
                                </Form.Select></Form.Group></Col>
                        </Row>
                        {formData.treatmentPackageId > 0 && <small className="text-muted">Thay đổi chỉ áp dụng cho lần bán sau; gói khách đã mua giữ nguyên số buổi và hạn dùng.</small>}
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-0">
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</Button>
                        <Button variant="primary" type="submit" disabled={saving}>{formData.treatmentPackageId ? 'Lưu thay đổi' : 'Tạo mới'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default TreatmentPackageList;
