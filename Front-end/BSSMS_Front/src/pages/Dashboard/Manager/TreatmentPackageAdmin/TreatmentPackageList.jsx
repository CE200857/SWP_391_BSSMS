import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge } from 'react-bootstrap';
import { api, put, label } from '../../../../services/api';
import { useManagerSearchFilter } from '../../../../components/ManagerSearchFilter';
import { StatusToggleButton, StatusChangeModal } from '../../../../components/StatusToggle';
import FloatingAlert from "../../../../components/FloatingAlert";
import CreateTreatmentPackageModal from "./CreateTreatmentPackageModal";
import UpdateTreatmentPackageModal from "./UpdateTreatmentPackageModal";
import DeleteTreatmentPackageModal from "./DeleteTreatmentPackageModal";

const TreatmentPackageList = () => {
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isManager = user?.role === 'Manager';
    // Each CRUD action lives in its own modal file (Create/Update/Delete…Modal.jsx)
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
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

    const afterChange = (message) => {
        setNotice(message);
        setShowCreate(false);
        setEditTarget(null);
        setDeleteTarget(null);
        load();
    };

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="manager-page-title fw-bold">Treatment package management</h2>
                {isManager && (
                    <Button variant="primary" className="fw-bold" onClick={() => setShowCreate(true)}>
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
                                                <Button variant="link" size="sm" className="manager-list-action manager-list-action--edit" onClick={() => setEditTarget(p)}>
                                                    <i className="bi bi-pencil-square"></i> Edit
                                                </Button>
                                                <Button variant="link" size="sm" className="manager-list-action manager-list-action--delete" onClick={() => setDeleteTarget(p)}>
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

            <CreateTreatmentPackageModal show={showCreate} services={services} onClose={() => setShowCreate(false)} onSaved={afterChange} />
            <UpdateTreatmentPackageModal pkg={editTarget} services={services} onClose={() => setEditTarget(null)} onSaved={afterChange} />
            <DeleteTreatmentPackageModal pkg={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={afterChange} />

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
