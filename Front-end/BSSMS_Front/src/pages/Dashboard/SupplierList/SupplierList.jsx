import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080/BSSMS-back/SupplierServlet'; // Chỉnh lại URL Servlet của bạn nếu khác

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: 0,
    supplierName: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active'
  });

  // 1. Fetch danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (err) {
      console.error('Lỗi kết nối API Supplier:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Thay đổi input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mở modal Thêm mới
  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      supplierId: 0,
      supplierName: '',
      phone: '',
      email: '',
      address: '',
      status: 'Active'
    });
    setShowModal(true);
  };

  // Mở modal Sửa
  const handleOpenEdit = (supplier) => {
    setIsEdit(true);
    setFormData(supplier);
    setShowModal(true);
  };

  // Gửi Form (Thêm hoặc Sửa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(API_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        fetchSuppliers();
      } else {
        alert('Có lỗi xảy ra khi lưu thông tin nhà cung cấp.');
      }
    } catch (err) {
      console.error('Lỗi khi gửi request:', err);
    }
  };

  // Xóa nhà cung cấp
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;

    try {
      const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSuppliers();
      } else {
        alert('Không thể xóa nhà cung cấp này.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa nhà cung cấp:', err);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Nhà cung cấp</h2>
        <button className="btn btn-success" onClick={handleOpenAdd}>
          + Thêm nhà cung cấp
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Tên nhà cung cấp</th>
                  <th>Số điện thoại</th>
                  <th>Email</th>
                  <th>Địa chỉ</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length > 0 ? (
                  suppliers.map((s) => (
                    <tr key={s.supplierId}>
                      <td>{s.supplierId}</td>
                      <td className="fw-bold">{s.supplierName}</td>
                      <td>{s.phone}</td>
                      <td>{s.email}</td>
                      <td>{s.address}</td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(s)}>
                          Sửa
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.supplierId)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">Chưa có dữ liệu nhà cung cấp</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Thêm/Sửa */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên nhà cung cấp</label>
                    <input type="text" className="form-control" name="supplierName" value={formData.supplierName} onChange={handleChange} required />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Số điện thoại</label>
                      <input type="text" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Địa chỉ</label>
                    <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-success">{isEdit ? 'Lưu thay đổi' : 'Tạo mới'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}