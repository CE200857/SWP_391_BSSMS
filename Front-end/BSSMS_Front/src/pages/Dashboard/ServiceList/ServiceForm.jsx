import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ServiceForm = () => {
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
            axios.get(`http://localhost:8080/api/services?id=${id}`)
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
                
                await axios.put(`http://localhost:8080/api/services?id=${id}`, formData);
                alert('Cập nhật thành công!');
            } else {
                
                await axios.post('http://localhost:8080/api/services', formData);
                alert('Thêm mới thành công!');
            }
            navigate('/services'); 
        } catch (error) {
            console.error("Lỗi lưu dữ liệu:", error);
            alert('Có lỗi xảy ra, xem F12 Console để biết thêm chi tiết!');
        }
    };

    return (
        <div className="container mt-4">
            <h2>{id ? 'Cập nhật Dịch vụ' : 'Thêm Dịch vụ mới'}</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Tên dịch vụ:</label>
                    <input type="text" className="form-control" name="serviceName" value={formData.serviceName} onChange={handleChange} required />
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Mô tả:</label>
                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange}></textarea>
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Giá tiền (VNĐ):</label>
                    <input type="number" className="form-control" name="price" value={formData.price} onChange={handleChange} required />
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Thời lượng (phút):</label>
                    <input type="number" className="form-control" name="duration" value={formData.duration} onChange={handleChange} required />
                </div>
                
                <div className="mb-3">
                    <label className="form-label">Trạng thái:</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
                
                <button type="submit" className="btn btn-success">
                    {id ? 'Cập nhật' : 'Lưu mới'}
                </button>
                <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/services')}>
                    Hủy bỏ
                </button>
            </form>
        </div>
    );
};

export default ServiceForm;