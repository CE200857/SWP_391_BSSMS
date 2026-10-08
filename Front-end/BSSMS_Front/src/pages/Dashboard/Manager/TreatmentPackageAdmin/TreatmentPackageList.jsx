import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Modal, Col } from 'react-bootstrap';
import axios from 'axios';

const TreatmentPackageList = () => {
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [refresh, setRefresh] = useState(0);
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isManager = user?.role === 'Manager';

    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        treatmentPackageId: 0,
        serviceId: '',
        packageName: '',
        description: '',
        price: '',
        numberOfSessions: ''
    });

    // Tải danh sách Gói liệu trình và Dịch vụ (để chọn trong Form)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const pkgRes = await axios.get('/api/treatment-packages', { withCredentials: true });
                setPackages(pkgRes.data);

                const srvRes = await axios.get('/api/service', { withCredentials: true });
                setServices(srvRes.data);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
            }
        };
        fetchData();
    }, [refresh]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOpenAdd = () => {
        setIsEdit(false);
        setFormData({ treatmentPackageId: 0, serviceId: '', packageName: '', description: '', price: '', numberOfSessions: '' });
        setShowModal(true);
    };

    const handleOpenEdit = (pkg) => {
        setIsEdit(true);
        setFormData(pkg);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await axios.put('/api/treatment-packages', formData, { withCredentials: true });
            } else {
                await axios.post('/api/treatment-packages', formData, { withCredentials: true });
            }
            setShowModal(false);
            setRefresh(prev => prev + 1);
        } catch (error) {
            console.error("Lỗi lưu dữ liệu:", error);
            alert("Có lỗi xảy ra khi lưu gói liệu trình!");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa gói liệu trình này?")) {
            try {
                await axios.delete(`/api/treatment-packages?id=${id}`, { withCredentials: true });
                setRefresh(prev => prev + 1);
            } catch (error) {
                console.error("Lỗi xóa dữ liệu:", error);
                alert("Không thể xóa gói liệu trình này!");
            }
        }
    };

    const getServiceName = (id) => {
        const s = services.find(srv => srv.serviceId === id);
        return s ? s.serviceName : `Dịch vụ #${id}`;
    };

    const filteredPackages = packages.filter(p =>
        p.packageName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container fluid className="mt-4 px-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold text-uppercase">Quản lý Gói liệu trình</h2>
                {isManager && (
                    <Button variant="primary" className="fw-bold" onClick={handleOpenAdd}>
                        <i className="bi bi-plus-lg me-1"></i> Thêm gói mới
                    </Button>
                )}
            </div>

            <Card className="shadow-sm border-0 mb-4">
                <Card.Body>
                    <InputGroup style={{ maxWidth: '400px' }}>
                        <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                        <Form.Control
                            placeholder="Tìm kiếm theo tên gói..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Card.Body>
            </Card>

            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    <Table striped bordered hover responsive className="align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Tên gói</th>
                                <th>Thuộc dịch vụ</th>
                                <th>Số buổi</th>
                                <th>Giá trọn gói (VNĐ)</th>
                                {/* Chỉ hiển thị cột Hành động nếu là Manager */}
                                {isManager && <th className="text-center">Hành động</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPackages.length > 0 ? filteredPackages.map((p) => (
                                <tr key={p.treatmentPackageId}>
                                    <td className="fw-bold">{p.treatmentPackageId}</td>
                                    <td className="text-primary fw-bold">{p.packageName}</td>
                                    <td>
                                        <span className="badge bg-info text-dark">
                                            {getServiceName(p.serviceId)}
                                        </span>
                                    </td>
                                    <td>{p.numberOfSessions} buổi</td>
                                    <td className="text-danger fw-bold">
                                        {Number(p.price).toLocaleString('vi-VN')}
                                    </td>

                                    {/* Chỉ render các nút Sửa/Xóa nếu là Manager */}
                                    {isManager && (
                                        <td className="text-center">
                                            <Button variant="warning" size="sm" className="treatment-package-action-btn treatment-package-action-btn--edit me-2" onClick={() => handleOpenEdit(p)}>
                                                <i className="bi bi-pencil-square"></i> Sửa
                                            </Button>
                                            <Button variant="danger" size="sm" className="treatment-package-action-btn" onClick={() => handleDelete(p.treatmentPackageId)}>
                                                <i className="bi bi-trash"></i> Xóa
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    {/* Tự động chỉnh colSpan: Manager là 6 cột, người khác là 5 cột */}
                                    <td colSpan={isManager ? "6" : "5"} className="text-center py-4 text-muted">
                                        Chưa có gói liệu trình nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            {/* Modal Thêm / Sửa */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="fw-bold">{isEdit ? 'Cập nhật Gói liệu trình' : 'Thêm Gói liệu trình'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Tên gói liệu trình*</Form.Label>
                            <Form.Control type="text" name="packageName" value={formData.packageName} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Chọn Dịch vụ áp dụng*</Form.Label>
                            <Form.Select name="serviceId" value={formData.serviceId} onChange={handleChange} required>
                                <option value="">-- Chọn dịch vụ --</option>
                                {services.map(s => <option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>)}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Mô tả chi tiết</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
                        </Form.Group>
                        <div className="row">
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Số buổi*</Form.Label>
                                    <Form.Control type="number" min="1" name="numberOfSessions" value={formData.numberOfSessions} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Giá trọn gói (VNĐ)*</Form.Label>
                                    <Form.Control type="number" min="0" name="price" value={formData.price} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-0">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
                        <Button variant="primary" type="submit">{isEdit ? 'Lưu thay đổi' : 'Tạo mới'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default TreatmentPackageList;