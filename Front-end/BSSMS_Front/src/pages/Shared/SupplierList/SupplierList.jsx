import { useState, useEffect } from 'react';

const API_URL = '/api/suppliers'

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Fetch danh sách nhà cung cấp
  const fetchSuppliers = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      } else {
        console.error('Lỗi khi gọi API:', res.status);
      }
    } catch (err) {
      console.error('Lỗi kết nối API Supplier:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleOpenEdit = (supplier) => {
    setIsEdit(true);
    setFormData({
      supplierId: supplier.supplierId || supplier.supplier_id || 0,
      supplierName: supplier.supplierName || supplier.supplier_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      status: supplier.status || 'Active'
    });
    setShowModal(true);
  };

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

  // Lọc danh sách hỗ trợ cả camelCase lẫn snake_case từ backend
  const filteredSuppliers = suppliers.filter((s) => {
    const name = s.supplierName || s.supplier_name || '';
    const phone = s.phone || '';
    const email = s.email || '';

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Quản lý Nhà cung cấp</h2>
        <button className="btn btn-primary px-3 py-2 fw-bold" onClick={handleOpenAdd}>
          + Thêm nhà cung cấp mới
        </button>
      </div>

      {/* Thanh tìm kiếm */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm theo tên, SĐT, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#212529', color: '#fff' }}>
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3">Tên nhà cung cấp</th>
                  <th className="py-3">Số điện thoại</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Địa chỉ</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => {
                    const id = s.supplierId || s.supplier_id;
                    const name = s.supplierName || s.supplier_name;

                    return (
                      <tr key={id}>
                        <td className="px-3 fw-bold">{id}</td>
                        <td className="fw-bold">{name}</td>
                        <td>{s.phone}</td>
                        <td>{s.email}</td>
                        <td>{s.address}</td>
                        <td>
                          <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleOpenEdit(s)}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(id)}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Không tìm thấy dữ liệu nhà cung cấp nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {isEdit ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Tên nhà cung cấp</label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Số điện thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Địa chỉ</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Trạng thái</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
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
}