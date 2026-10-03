import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ServiceList = () => {
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loadError, setLoadError] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const filteredServices = services.filter(service => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch = !search ||
            String(service.serviceId).toLowerCase().includes(search) ||
            service.serviceName?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const fetchServices = async () => {
        try {
            const response = await axios.get('/api/service');
            setServices(response.data);
            setLoadError(false);
        } catch (error) {
            console.error("Lỗi tải danh sách:", error);
            setLoadError(true);
        }
    };

    useEffect(() => {
        axios.get('/api/service')
            .then(response => {
                setServices(response.data);
                setLoadError(false);
            })
            .catch(error => {
                console.error("Lỗi tải danh sách:", error);
                setLoadError(true);
            });
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            await axios.delete(`/api/service?id=${deleteTarget.serviceId}`);
            alert('Xóa thành công!');
            setDeleteTarget(null);
            fetchServices();
        } catch (error) {
            console.error('Lỗi xóa:', error);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-3">Danh sách Dịch vụ</h2>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div className="d-flex flex-wrap gap-2 flex-grow-1">
                    <input
                        type="search"
                        className="form-control"
                        style={{ maxWidth: '360px' }}
                        placeholder="Tìm theo tên hoặc ID dịch vụ..."
                        aria-label="Tìm dịch vụ theo tên hoặc ID"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                    />
                    <select
                        className="form-select"
                        style={{ maxWidth: '190px' }}
                        aria-label="Lọc theo trạng thái"
                        value={statusFilter}
                        onChange={event => setStatusFilter(event.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Active">Đang hoạt động</option>
                        <option value="Inactive">Ngừng hoạt động</option>
                    </select>
                </div>
                <Link to="/services/new" className="btn btn-primary ms-auto">
                    Thêm dịch vụ mới
                </Link>
            </div>

            <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Tên dịch vụ</th>
                        <th>Giá (VNĐ)</th>
                        <th>Thời lượng (phút)</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredServices.length > 0 ? filteredServices.map(s => (
                        <tr key={s.serviceId}>
                            <td>{s.serviceId}</td>
                            <td>{s.serviceName}</td>
                            <td>{Number(s.price).toLocaleString('vi-VN')}</td>
                            <td>{s.duration}</td>
                            <td>
                                <span className={s.status === 'Active' ? 'text-success' : 'text-danger'}>
                                    {s.status}
                                </span>
                            </td>
                            <td>
                                
                                <Link to={`/services/edit/${s.serviceId}`} className="btn btn-warning btn-sm me-2">
                                    Sửa
                                </Link>
                                <button onClick={() => setDeleteTarget(s)} className="btn btn-danger btn-sm">
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="6" className="text-center text-muted py-4">
                                {loadError
                                    ? 'Không tải được danh sách dịch vụ. Hãy kiểm tra backend và thử tải lại.'
                                    : services.length === 0
                                        ? 'Chưa có dịch vụ nào.'
                                        : 'Không tìm thấy dịch vụ phù hợp.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>

            {deleteTarget && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.38)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1050
                }}>
                    <div style={{
                        width: 'min(760px, 92vw)',
                        backgroundColor: '#f4f4f4',
                        borderRadius: '14px',
                        boxShadow: '0 10px 28px rgba(0,0,0,0.2)',
                        padding: '18px 20px 16px',
                        border: '1px solid #d8d8d8'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e53935', fontWeight: '700', fontSize: '1.7rem' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '8px',
                                    backgroundColor: '#fbe4e4',
                                    fontSize: '1.5rem',
                                    lineHeight: 1
                                }}>!</span>
                                <span style={{ fontSize: '1.8rem', color: '#e53935' }}>Xác nhận xóa dịch vụ</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    fontSize: '2.1rem',
                                    color: '#1f1f1f',
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                    padding: 0,
                                    marginLeft: '10px'
                                }}
                                aria-label="Đóng"
                            >×</button>
                        </div>

                        <div style={{
                            fontSize: '1.45rem',
                            color: '#111',
                            margin: '14px 0 26px',
                            lineHeight: 1.5,
                            fontWeight: 500,
                            wordBreak: 'break-word'
                        }}>
                            Bạn có chắc chắn muốn xóa dịch vụ{' '}
                            <span style={{ color: '#0d6efd', fontWeight: '700' }}>
                                {deleteTarget.serviceName}
                            </span>
                            {' '}không?
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteTarget(null)}
                                style={{
                                    border: 'none',
                                    backgroundColor: '#b7b7b7',
                                    color: '#fff',
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    borderRadius: '10px',
                                    padding: '12px 18px',
                                    minWidth: '120px',
                                    cursor: 'pointer'
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                style={{
                                    border: 'none',
                                    backgroundColor: '#e53935',
                                    color: '#fff',
                                    fontSize: '1.2rem',
                                    fontWeight: '600',
                                    borderRadius: '10px',
                                    padding: '12px 18px',
                                    minWidth: '140px',
                                    cursor: 'pointer'
                                }}
                            >
                                Xóa dịch vụ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceList;