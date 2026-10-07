import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ServiceList = () => {
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loadError, setLoadError] = useState(false);

    // 1. THÊM BIẾN REFRESH ĐỂ KÍCH HOẠT LOAD LẠI DATA
    const [refresh, setRefresh] = useState(0);

    // Lấy thông tin user để phân quyền hiển thị nút bấm
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isManager = user?.role === 'Manager';
    const isGuest = !user; // Nếu không có user thì là khách vãng lai

    const filteredServices = services.filter(service => {
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch = !search ||
            String(service.serviceId).toLowerCase().includes(search) ||
            service.serviceName?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // 2. ĐƯA TOÀN BỘ LOGIC GỌI API VÀO TRONG useEffect
    useEffect(() => {
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

        fetchServices();
    }, [refresh]); // <-- Lắng nghe biến refresh. Mỗi lần biến này đổi, API sẽ tự động gọi lại.

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
            try {
                await axios.delete(`/api/service?id=${id}`);
                alert("Xóa thành công!");

                // 3. THAY VÌ GỌI fetchServices(), TA CHỈ CẦN TĂNG BIẾN REFRESH LÊN 1
                setRefresh(prev => prev + 1);
            } catch (error) {
                console.error("Lỗi xóa:", error);
            }
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

                {/* CHỈ MANAGER MỚI THẤY NÚT THÊM MỚI */}
                {isManager && (
                    <Link to="/services/new" className="btn btn-primary ms-auto">
                        Thêm dịch vụ mới
                    </Link>
                )}
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
                                    {/* 1. NÚT XEM CHI TIẾT DÀNH CHO TẤT CẢ MỌI NGƯỜI */}
                                    <Link
                                        to={isGuest ? `/guest/services/${s.serviceId}` : `/services/detail/${s.serviceId}`}
                                        className="btn btn-info btn-sm text-white me-2"
                                    >
                                        Xem chi tiết
                                    </Link>

                                    {/* 2. NÚT SỬA/XÓA CHỈ DÀNH RIÊNG CHO MANAGER */}
                                    {isManager && (
                                        <>
                                            <Link to={`/services/edit/${s.serviceId}`} className="btn btn-warning btn-sm me-2">
                                                Sửa
                                            </Link>
                                            <button onClick={() => handleDelete(s.serviceId)} className="btn btn-danger btn-sm">
                                                Xóa
                                            </button>
                                        </>
                                    )}
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
        </div>
    );
};

export default ServiceList;