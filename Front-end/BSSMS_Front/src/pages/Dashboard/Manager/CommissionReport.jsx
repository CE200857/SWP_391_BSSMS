// src/pages/Dashboard/Manager/CommissionReport.jsx
import React, { useState, useEffect } from 'react';
import { getCommissionReport } from '../../../services/commissionService';

const CommissionReport = () => {
    // State dữ liệu báo cáo
    const [filterType, setFilterType] = useState('monthly');
    const currentDate = new Date();
    const defaultYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    const [yearMonth, setYearMonth] = useState(defaultYearMonth);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // State mẫu cho chức năng Thêm / Sửa / Xóa cấu hình hoa hồng (CRUD Mock/Integration)
    const [commissionRules, setCommissionRules] = useState([
        { id: 1, serviceName: 'Chăm sóc da mặt cơ bản', rate: '10%', description: 'Áp dụng cho kỹ thuật viên chính' },
        { id: 2, serviceName: 'Điều trị mụn chuyên sâu', rate: '15%', description: 'Áp dụng cho ca trị liệu trên 60 phút' }
    ]);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [formData, setFormData] = useState({ serviceName: '', rate: '', description: '' });

    useEffect(() => {
        handleAutoFetchMonthly(defaultYearMonth);
    }, []);

    const handleAutoFetchMonthly = async (ym) => {
        setLoading(true);
        setError('');
        setHasSearched(true);
        try {
            const [year, month] = ym.split('-');
            const firstDay = `${year}-${month}-01`;
            const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

            const data = await getCommissionReport(firstDay, lastDay);
            setReportData(data);
        } catch (err) {
            setError('Lỗi khi tải dữ liệu báo cáo hoa hồng tháng.');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError('');
        setHasSearched(true);

        let start = startDate;
        let end = endDate;

        if (filterType === 'monthly') {
            if (!yearMonth) {
                setError('Vui lòng chọn tháng và năm.');
                return;
            }
            const [year, month] = yearMonth.split('-');
            start = `${year}-${month}-01`;
            end = new Date(year, month, 0).toISOString().split('T')[0];
        } else {
            if (!startDate || !endDate) {
                setError('Vui lòng chọn đầy đủ từ ngày và đến ngày.');
                return;
            }
        }

        setLoading(true);
        try {
            const data = await getCommissionReport(start, end);
            setReportData(data);
        } catch (err) {
            setError('Lỗi khi tải dữ liệu báo cáo. Vui lòng thử lại sau.');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // --- Các hàm xử lý Thêm, Sửa, Xóa chính sách hoa hồng ---
    const handleOpenAddModal = () => {
        setEditingRule(null);
        setFormData({ serviceName: '', rate: '', description: '' });
        setShowModal(true);
    };

    const handleOpenEditModal = (rule) => {
        setEditingRule(rule);
        setFormData({ serviceName: rule.serviceName, rate: rule.rate, description: rule.description });
        setShowModal(true);
    };

    const handleDeleteRule = (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa quy tắc hoa hồng này không?')) {
            setCommissionRules(commissionRules.filter(item => item.id !== id));
        }
    };

    const handleSaveRule = (e) => {
        e.preventDefault();
        if (editingRule) {
            // Sửa
            setCommissionRules(commissionRules.map(item => item.id === editingRule.id ? { ...item, ...formData } : item));
        } else {
            // Thêm mới
            const newRule = {
                id: Date.now(),
                ...formData
            };
            setCommissionRules([...commissionRules, newRule]);
        }
        setShowModal(false);
    };

    const totalCompanyCommission = reportData.reduce((sum, item) => sum + item.totalCommissionAmount, 0);
    const totalInvoicesCount = reportData.reduce((sum, item) => sum + item.totalInvoices, 0);

    return (
        <div className="container py-4">
            {/* Tiêu đề trang */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-3 mb-4 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Quản Lý & Báo Cáo Hoa Hồng</h2>
                    <p className="text-muted small mb-0">Theo dõi doanh thu hoa hồng nhân viên và cấu hình mức chiết khấu dịch vụ</p>
                </div>
                
                {/* Nút mở Modal Thêm quy tắc hoa hồng mới */}
                <button 
                    type="button" 
                    className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
                    onClick={handleOpenAddModal}
                >
                    <i className="bi bi-plus-lg"></i> Thêm mức hoa hồng
                </button>
            </div>

            {/* PHẦN 1: BẢNG CẤU HÌNH QUY TẮC HOA HỒNG (CRUD Thêm / Sửa / Xóa) */}
            <div className="card shadow-sm border-0 mb-5">
                <div className="card-header bg-white py-3">
                    <h5 className="fw-bold mb-0 text-secondary"><i className="bi bi-sliders me-2"></i>Cấu hình tỷ lệ hoa hồng dịch vụ</h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4">#ID</th>
                                    <th>Tên Dịch Vụ / Gói</th>
                                    <th>Tỷ Lệ / Mức Hoa Hồng</th>
                                    <th>Mô Tả Quy Định</th>
                                    <th className="text-end pe-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissionRules.map((rule, idx) => (
                                    <tr key={rule.id}>
                                        <td className="ps-4 fw-bold text-muted">#{idx + 1}</td>
                                        <td className="fw-semibold text-dark">{rule.serviceName}</td>
                                        <td><span className="badge bg-success-subtle text-success px-2 py-1">{rule.rate}</span></td>
                                        <td className="text-muted small">{rule.description}</td>
                                        <td className="text-end pe-4">
                                            <button 
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => handleOpenEditModal(rule)}
                                                title="Sửa"
                                            >
                                                <i className="bi bi-pencil-square"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteRule(rule.id)}
                                                title="Xóa"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* PHẦN 2: BÁO CÁO THỐNG KÊ HOA HỒNG NHÂN VIÊN */}
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-secondary"><i className="bi bi-graph-up-arrow me-2"></i>Báo Cáo Hoa Hồng Theo Kỳ</h5>
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${filterType === 'monthly' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilterType('monthly')}
                        >
                            Theo tháng
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${filterType === 'dateRange' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setFilterType('dateRange')}
                        >
                            Khoảng ngày
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {/* Form Lọc báo cáo */}
                    <form onSubmit={handleSearch} className="row g-3 align-items-end bg-light p-3 rounded-3 mb-4 border">
                        {filterType === 'monthly' ? (
                            <div className="col-md-4">
                                <label htmlFor="yearMonth" className="form-label fw-semibold small">Chọn Tháng & Năm</label>
                                <input 
                                    type="month" 
                                    id="yearMonth"
                                    value={yearMonth} 
                                    onChange={(e) => setYearMonth(e.target.value)} 
                                    className="form-control"
                                    required
                                />
                            </div>
                        ) : (
                            <>
                                <div className="col-md-4">
                                    <label htmlFor="startDate" className="form-label fw-semibold small">Từ ngày</label>
                                    <input 
                                        type="date" 
                                        id="startDate"
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)} 
                                        className="form-control"
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="endDate" className="form-label fw-semibold small">Đến ngày</label>
                                    <input 
                                        type="date" 
                                        id="endDate"
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                        className="form-control"
                                        required
                                    />
                                </div>
                            </>
                        )}
                        <div className="col-md-4">
                            <button type="submit" disabled={loading} className="btn btn-dark w-100 shadow-sm">
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-search me-2"></i>}
                                Xem báo cáo
                            </button>
                        </div>
                    </form>

                    {error && <div className="alert alert-danger py-2">{error}</div>}

                    {/* Thẻ thống kê tổng quan */}
                    {!loading && hasSearched && reportData.length > 0 && (
                        <div className="row g-3 mb-4">
                            <div className="col-md-6">
                                <div className="p-3 bg-primary text-white rounded-3 shadow-sm">
                                    <span className="small opacity-75">Tổng số ca / hóa đơn hoa hồng</span>
                                    <h3 className="fw-bold mb-0 mt-1">{totalInvoicesCount} ca</h3>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 bg-success text-white rounded-3 shadow-sm">
                                    <span className="small opacity-75">Tổng chi phí hoa hồng chi trả</span>
                                    <h3 className="fw-bold mb-0 mt-1">{formatCurrency(totalCompanyCommission)}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bảng kết quả báo cáo */}
                    {!loading && hasSearched && !error && (
                        reportData.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover align-middle border">
                                    <thead className="table-dark">
                                        <tr>
                                            <th className="ps-3">Mã NV</th>
                                            <th>Họ và Tên Nhân Viên</th>
                                            <th className="text-center">Số Hóa Đơn</th>
                                            <th className="text-end pe-3">Tổng Hoa Hồng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((item) => (
                                            <tr key={item.staffId}>
                                                <td className="ps-3 fw-bold text-muted">#{item.staffId}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                                                            {item.staffName ? item.staffName.charAt(0).toUpperCase() : 'N'}
                                                        </div>
                                                        <span className="fw-semibold text-dark">{item.staffName}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <span className="badge bg-secondary px-2 py-1">{item.totalInvoices} ca</span>
                                                </td>
                                                <td className="text-end pe-3 fw-bold text-success">
                                                    {formatCurrency(item.totalCommissionAmount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 bg-light rounded-3 border border-dashed">
                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                <p className="text-muted mt-2 mb-0">Không có dữ liệu hoa hồng trong khoảng thời gian này.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* MODAL THÊM / SỬA QUY TẮC HOA HỒNG (Bootstrap Modal) */}
            {showModal && (
                <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <form onSubmit={handleSaveRule}>
                                <div className="modal-header bg-light">
                                    <h5 className="modal-title fw-bold">
                                        {editingRule ? 'Sửa mức hoa hồng' : 'Thêm quy tắc hoa hồng mới'}
                                    </h5>
                                    type="button" 
                                    <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Tên Dịch Vụ / Gói</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Ví dụ: Chăm sóc da chuyên sâu"
                                            value={formData.serviceName} 
                                            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Tỷ Lệ / Mức Hoa Hồng</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Ví dụ: 15% hoặc 50.000đ"
                                            value={formData.rate} 
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold small">Mô Tả Quy Định</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="2"
                                            placeholder="Nhập mô tả chi tiết điều kiện nhận hoa hồng..."
                                            value={formData.description} 
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button type="submit" className="btn btn-primary px-4">Lưu lại</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export class CommissionReportService {}
export default CommissionReport;