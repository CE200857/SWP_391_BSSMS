import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

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

    useEffect(() => {
        if (id) {
            axios.get(`/api/service?id=${id}`)
                .then(res => setFormData(res.data))
                .catch(err => console.error("Lỗi lấy dữ liệu:", err));
        }
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