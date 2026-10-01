import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ServiceList = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/services');
            setServices(response.data);
        } catch (error) {
            console.error("Lỗi tải danh sách:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
            try {
                await axios.delete(`http://localhost:8080/api/services?id=${id}`);
                alert("Xóa thành công!");
                fetchServices(); 
            } catch (error) {
                console.error("Lỗi xóa:", error);
            }
        }
    };

    return (
        <div className="container mt-4">
            <h2>Danh sách Dịch vụ</h2>
            
            
            <Link to="/services/new" className="btn btn-primary mb-3">
                Thêm dịch vụ mới
            </Link>

            <table className="table table-bordered table-hover">
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
                    {services.map(s => (
                        <tr key={s.serviceId}>
                            <td>{s.serviceId}</td>
                            <td>{s.serviceName}</td>
                            <td>{s.price}</td>
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
                                <button onClick={() => handleDelete(s.serviceId)} className="btn btn-danger btn-sm">
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ServiceList;