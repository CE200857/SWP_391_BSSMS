import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Form, Modal, Col, Row, Badge } from 'react-bootstrap';
import { api, post, put, del, money, label } from '../../../../services/api';
import { useManagerSearchFilter } from '../../../../components/ManagerSearchFilter';
import { StatusToggleButton, StatusChangeModal } from '../../../../components/StatusToggle';
import FloatingAlert from "../../../../components/FloatingAlert";

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
    const [statusTarget, setStatusTarget] = useState(null);
    const [statusBusy, setStatusBusy] = useState(false);

    // Bấm nhãn trạng thái: đổi Active (đang bán) <-> Inactive (ngừng bán)
    const confirmStatusChange = async () => {
        const p = statusTarget;
        if (!p) return;
        setStatusBusy(true);
        try {
            const r = await put('/api/treatment-packages', {
                treatmentPackageId: p.treatmentPackageId, packageName: p.packageName, description: p.description || null,
                price: Number(p.price), numberOfSessions: Number(p.numberOfSessions), validityDays: Number(p.validityDays),
                status: p.status === 'Active' ? 'Inactive' : 'Active', serviceIds: p.serviceIds || [],
            });
            setNotice(r?.message || 'Status changed.');
            setStatusTarget(null);
            load();
        } catch (err) {
            setError(err.message);
            setStatusTarget(null);
        } finally {
            setStatusBusy(false);
        }
    };

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
            { key: 'packageName', label: 'Package name', filterable: false },
            { key: 'services', label: 'Service', filterable: false, getValue: (p) => (p.services || []).map((s) => s.serviceName).join(', ') },
            { key: 'status', label: 'Status', formatValue: label },
        ],
        'Search by package name or service...'
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
        if (!formData.serviceIds.length) return setFormError('Choose at least one applicable service.');
        setSaving(true);
        setFormError('');
        const body = {
            treatmentPackageId: formData.treatmentPackageId, packageName: formData.packageName.trim(), description: formData.description?.trim() || null,
            price: Number(formData.price), numberOfSessions: Number(formData.numberOfSessions), validityDays: Number(formData.validityDays),
            status: formData.status, serviceIds: formData.serviceIds,
        };
        try {
            const r = formData.treatmentPackageId ? await put('/api/treatment-packages', body) : await post('/api/treatment-packages', body);
            setNotice(r?.message || 'Treatment package saved.');
            setShowModal(false);
            load();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (p) => {
        if (!window.confirm(`Delete "${p.packageName}"? It is removed from the list and no longer sold. Customers who already bought it can still use it until it expires.`)) return;
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
                <h2 className="manager-page-title fw-bold">Treatment package management</h2>
                {isManager && (
                    <Button variant="primary" className="fw-bold" onClick={() => open(null)}>
                        <i className="bi bi-plus-lg me-1"></i> Add new package
                    </Button>
                )}
            </div>
            <FloatingAlert message={error} onClose={() => setError("")} />
            <FloatingAlert message={notice} variant="success" onClose={() => setNotice("")} />

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body><div className="manager-list-toolbar">{toolbar}</div></Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table hover responsive className="align-middle mb-0 manager-list-table">
                        <thead className="table-dark">
                            <tr>
                                <th>Package name</th>
                                <th>Services</th>
                                <th>Sessions</th>
                                <th>Valid for</th>
                                <th>Price (VND)</th>
                                <th>Status</th>
                                {isManager && <th className="text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages.length > 0 ? filteredPackages.map((p) => (
                                <tr key={p.treatmentPackageId}>
                                    {/* Mỗi ô 1 dòng; mô tả và số khách đang dùng hiện khi rê chuột vào tên gói */}
                                    <td className="treatment-package-name fw-semibold text-dark" title={[p.description, isManager ? `${p.customerCount} customer(s) using it` : ""].filter(Boolean).join(" · ") || undefined}>{p.packageName}</td>
                                    <td className="treatment-package-services" title={(p.services || []).map((s) => s.serviceName).join(", ") || undefined}>
                                        {(p.services || [])[0]?.serviceName || "—"}
                                        {(p.services || []).length > 1 && <span className="text-muted"> +{p.services.length - 1}</span>}
                                    </td>
                                    <td>{p.numberOfSessions}</td>
                                    <td className="text-nowrap">{p.validityDays} days</td>
                                    <td className="text-nowrap">{Number(p.price || 0).toLocaleString("vi-VN")}</td>
                                    <td>{isManager
                                        ? <StatusToggleButton active={p.status === 'Active'} onClick={() => setStatusTarget(p)} />
                                        : <Badge bg={p.status === 'Active' ? 'success' : 'secondary'}>{label(p.status)}</Badge>}</td>
                                    {isManager && (
                                        <td className="text-center">
                                            <div className="manager-list-actions treatment-package-actions">
                                                <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => open(p)}>
                                                    <i className="bi bi-pencil-square"></i> Edit
                                                </Button>
                                                <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => handleDelete(p)}>
                                                    <i className="bi bi-trash"></i> Delete
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr><td colSpan={isManager ? 7 : 6} className="text-center py-4 text-muted">No treatment packages yet.</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => !saving && setShowModal(false)} centered backdrop="static" size="lg">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold">{formData.treatmentPackageId ? 'Update treatment package' : 'Add treatment package'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <FloatingAlert message={formError} onClose={() => setFormError("")} />
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Treatment package name*</Form.Label>
                            <Form.Control maxLength={150} value={formData.packageName} onChange={(e) => setFormData({ ...formData, packageName: e.target.value })} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Applicable services* <small className="text-muted fw-normal">(each session can be used for one of these services)</small></Form.Label>
                            <div className="d-flex flex-wrap gap-3 border rounded p-2" style={{ maxHeight: 180, overflowY: 'auto' }}>
                                {services.map((s) => (
                                    <Form.Check key={s.serviceId} id={`pkg-svc-${s.serviceId}`} label={`${s.serviceName} (${money(s.price)})`}
                                        checked={formData.serviceIds.includes(s.serviceId)} onChange={() => toggleService(s.serviceId)} />
                                ))}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Detailed description</Form.Label>
                            <Form.Control as="textarea" rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </Form.Group>
                        <Row>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Sessions*</Form.Label>
                                <Form.Control type="number" min="1" max="100" value={formData.numberOfSessions} onChange={(e) => setFormData({ ...formData, numberOfSessions: e.target.value })} required /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Validity (days)*</Form.Label>
                                <Form.Control type="number" min="1" max="1095" value={formData.validityDays} onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })} required /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Package price (VND)*</Form.Label>
                                <Form.Control type="number" min="1000" step="1000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required /></Form.Group></Col>
                            <Col md={3}><Form.Group className="mb-3"><Form.Label className="fw-bold">Status</Form.Label>
                                <Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">On sale</option><option value="Inactive">Stop selling</option>
                                </Form.Select></Form.Group></Col>
                        </Row>
                        {formData.treatmentPackageId > 0 && <small className="text-muted">Changes only apply to future sales; packages customers bought keep their sessions and expiry date.</small>}
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-0">
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={saving}>{formData.treatmentPackageId ? 'Save changes' : 'Create'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <StatusChangeModal
                show={!!statusTarget}
                entity="treatment package"
                name={statusTarget?.packageName}
                nextActive={statusTarget?.status !== 'Active'}
                busy={statusBusy}
                onCancel={() => setStatusTarget(null)}
                onConfirm={confirmStatusChange}
            />
        </Container>
    );
};

export default TreatmentPackageList;
