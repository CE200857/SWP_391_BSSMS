import React, { useEffect, useState } from 'react';

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    contactName: '',
    phone: '',
    email: '',
    address: ''
  });

  const API_URL = 'http://localhost:8080/BeautySalon_Backend/api/suppliers';

  const fetchSuppliers = () => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setSuppliers(data);
        setLoading(false);
      })
      .catch((err) => console.error('Lỗi API Suppliers:', err));
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({ supplierId: '', supplierName: '', contactName: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (supplier) => {
    setIsEdit(true);
    setFormData(supplier);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa nhà cung cấp này?')) {
      fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(() => fetchSuppliers())
        .catch((err) => console.error('Lỗi xóa nhà cung cấp:', err));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const method = isEdit ? 'PUT' : 'POST';

    fetch(API_URL, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(() => {
        setShowModal(false);
        fetchSuppliers();
      })
      .catch((err) => console.error('Lỗi lưu nhà cung cấp:', err));
  };

  if (loading) return <div className="text-center p-4">Đang tải danh sách nhà cung cấp...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Quản Lý Nhà Cung Cấp</h2>
        <button className="btn btn-success" onClick={handleOpenCreate}>
          + Create Supplier
        </button>
      </div>

      <table className="table table-bordered table-hover align-middle">
        <thead className="table-dark text-center">
          <tr>
            <th>ID</th>
            <th>Tên Nhà Cung Cấp</th>
            <th>Người Liên Hệ</th>
            <th>Số Điện Thoại</th>
            <th>Email</th>
            <th>Địa Chỉ</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.supplierId}>
              <td className="text-center">{s.supplierId}</td>
              <td className="fw-bold">{s.supplierName}</td>
              <td>{s.contactName}</td>
              <td>{s.phone}</td>
              <td>{s.email}</td>
              <td>{s.address}</td>
              <td className="text-center">
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenEdit(s)}>
                  Update
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.supplierId)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? 'Update Supplier' : 'Create Supplier'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên Nhà Cung Cấp</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Người Liên Hệ</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số Điện Thoại</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Địa Chỉ</label>
                    <textarea
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-success">
                    {isEdit ? 'Lưu thay đổi' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierList;