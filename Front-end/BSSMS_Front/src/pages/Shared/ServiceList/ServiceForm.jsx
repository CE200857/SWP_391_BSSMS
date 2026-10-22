import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import servicePhoto from '../../../assets/figma/service-card-exact-02.png';

const ServiceForm = ({ isReadOnly = false }) => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        serviceName: '',
        description: '',
        price: '',
        duration: '',
        status: 'Active'
    });
    const [loadError, setLoadError] = useState('');
    const [loadedId, setLoadedId] = useState(null);
    const isLoading = Boolean(id) && loadedId !== id;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isManager = user?.role === 'Manager';

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        axios.get(`/api/service?id=${id}`)
            .then(res => {
                if (!cancelled) {
                    setFormData(res.data);
                    setLoadError('');
                }
            })
            .catch(err => {
                console.error("Lỗi lấy dữ liệu:", err);
                if (!cancelled) setLoadError('Không thể tải thông tin dịch vụ. Vui lòng thử lại.');
            })
            .finally(() => {
                if (!cancelled) setLoadedId(id);
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await axios.put(`/api/service?id=${id}`, formData);
                alert('Cập nhật thành công!');
            } else {
                await axios.post('/api/service', formData);
                alert('Thêm mới thành công!');
            }
            navigate('/services'); 
        } catch (error) {
            console.error("Lỗi lưu dữ liệu:", error);
            alert('Có lỗi xảy ra, xem F12 Console để biết thêm chi tiết!');
        }
    };

    const pageTitle = isReadOnly 
        ? 'Chi tiết Dịch vụ' 
        : (id ? 'Cập nhật Dịch vụ' : 'Thêm Dịch vụ mới');

    if (isReadOnly && !isManager) {
        return (
            <main className="public-service-detail-page">
                <section className="customer-page-banner">
                    <div className="customer-page-container">
                        <div className="customer-breadcrumb">
                            <Link to="/bssms-guest">Trang chủ</Link>
                            <i className="bi bi-chevron-right" aria-hidden="true" />
                            <Link to="/guest/services">Danh sách dịch vụ</Link>
                            <i className="bi bi-chevron-right" aria-hidden="true" />
                            <strong>Chi tiết dịch vụ</strong>
                        </div>
                        <div className="public-detail-banner-title">
                            <h1>Chi tiết dịch vụ</h1>
                            <button type="button" onClick={() => navigate(-1)}>
                                <i className="bi bi-arrow-left" aria-hidden="true" /> Quay lại
                            </button>
                        </div>
                    </div>
                </section>
                <section className="public-detail-content">
                    {isLoading ? (
                        <div className="customer-empty-state" role="status">
                            <i className="bi bi-arrow-repeat" aria-hidden="true" />
                            <strong>Đang tải thông tin dịch vụ</strong>
                        </div>
                    ) : loadError ? (
                        <div className="customer-empty-state" role="alert">
                            <i className="bi bi-wifi-off" aria-hidden="true" />
                            <strong>{loadError}</strong>
                            <Link className="home-button home-button-white" to="/guest/services">Quay lại danh sách</Link>
                        </div>
                    ) : (
                        <div className="public-detail-grid">
                            <div className="public-detail-image">
                                <img src={servicePhoto} alt={`Trải nghiệm dịch vụ ${formData.serviceName}`} />
                                <div><span>SEOUL CENTER · SALON &amp; SPA</span><small>Hình ảnh dịch vụ mang tính minh họa.</small></div>
                            </div>
                            <div className="public-detail-copy">
                                <span className="home-eyebrow">DỊCH VỤ</span>
                                <h2>{formData.serviceName}</h2>
                                <span className="public-detail-description-label">Mô tả</span>
                                <p>{formData.description || 'Thông tin chi tiết sẽ được tư vấn theo nhu cầu của bạn.'}</p>
                                <div className="public-detail-facts">
                                    <span><small>Giá tiền</small><strong>{Number(formData.price || 0).toLocaleString('vi-VN')} VNĐ</strong></span>
                                    <span><small>Thời lượng</small><strong><i className="bi bi-clock" aria-hidden="true" /> {formData.duration || 0} phút</strong></span>
                                </div>
                                <Link
                                    className="home-button home-button-primary public-detail-booking"
                                    to={user?.role === 'Customer' ? '/appointments/online' : '/guest/slots'}
                                >
                                    <i className="bi bi-calendar2-check" aria-hidden="true" /> Đặt lịch hẹn
                                    <i className="bi bi-arrow-right" aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        );
    }

    return (
        <div className="container mt-4" style={{ maxWidth: '800px' }}>
            <h2 className="text-center mb-4">{pageTitle}</h2>
            
            {isReadOnly ? (
                /* --- GIAO DIỆN XEM CHI TIẾT (READ-ONLY) --- */
                <div className="card shadow-sm border-0">
                    <div className="card-body p-4">
                        <h4 className="text-primary mb-4 fw-bold">{formData.serviceName}</h4>
                        
                        <div className="row mb-3">
                            <div className="col-sm-3 text-muted fw-bold">Mô tả:</div>
                            <div className="col-sm-9">{formData.description || 'Không có mô tả'}</div>
                        </div>
                        
                        <div className="row mb-3">
                            <div className="col-sm-3 text-muted fw-bold">Giá tiền:</div>
                            <div className="col-sm-9 text-danger fw-bold">
                                {Number(formData.price).toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                        
                        <div className="row mb-3">
                            <div className="col-sm-3 text-muted fw-bold">Thời lượng:</div>
                            <div className="col-sm-9">{formData.duration} phút</div>
                        </div>
                        
                        <div className="row mb-4">
                            <div className="col-sm-3 text-muted fw-bold">Trạng thái:</div>
                            <div className="col-sm-9">
                                <span className={`badge ${formData.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                                    {formData.status === 'Active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-center mt-4 pt-3 border-top">
                            <button type="button" className="btn btn-secondary px-4" onClick={() => navigate(-1)}>
                                <i className="bi bi-arrow-left me-2"></i> Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- GIAO DIỆN FORM THÊM/SỬA --- */
                <div className="card shadow-sm border-0">
                    <div className="card-body p-4">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-bold">Tên dịch vụ:</label>
                                <input type="text" className="form-control" name="serviceName" value={formData.serviceName} onChange={handleChange} required />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label fw-bold">Mô tả:</label>
                                <textarea className="form-control" name="description" rows="3" value={formData.description} onChange={handleChange}></textarea>
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label fw-bold">Giá tiền (VNĐ):</label>
                                <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} required />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label fw-bold">Thời lượng (phút):</label>
                                <input type="number" className="form-control" name="duration" value={formData.duration} onChange={handleChange} required />
                            </div>
                            
                            <div className="mb-4">
                                <label className="form-label fw-bold">Trạng thái:</label>
                                <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            
                            <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => navigate(-1)}>
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="btn btn-success px-4">
                                    {id ? 'Cập nhật' : 'Lưu mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceForm;