import { useState, useEffect } from 'react';

// Đường dẫn API (hãy điều chỉnh lại nếu bạn dùng proxy '/api/products')
const API_URL = '/api/products';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    productId: 0,
    productName: '',
    description: '',
    unitPrice: 0,
    stockQuantity: 0,
    reorderLevel: 0,
    status: 'Active'
  });

  // Biến refresh dùng để trigger useEffect tải lại dữ liệu mà không bị lỗi linter
  const [refresh, setRefresh] = useState(0);

  // Lấy thông tin user từ localStorage để phân quyền
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isManager = user?.role?.toLowerCase()?.trim() === 'manager';

  // Đưa hàm fetch vào trong useEffect để tránh lỗi dependency
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(API_URL, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Lỗi kết nối API Product:', err);
      }
    };

    fetchProducts();
  }, [refresh]); // Lắng nghe biến refresh để gọi lại API

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'unitPrice' || name === 'stockQuantity' || name === 'reorderLevel'
        ? Number(value)
        : value
    }));
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      productId: 0,
      productName: '',
      description: '',
      unitPrice: 0,
      stockQuantity: 0,
      reorderLevel: 0,
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setIsEdit(true);
    setFormData(product);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(API_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: "include"
      });

      if (res.ok) {
        setShowModal(false);
        // Tăng biến refresh lên 1 để useEffect tự động gọi lại API
        setRefresh(prev => prev + 1);
      } else {
        alert('Có lỗi xảy ra khi lưu thông tin sản phẩm.');
      }
    } catch (err) {
      console.error('Lỗi khi gửi request:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE', credentials: "include" });
      if (res.ok) {
        // Tăng biến refresh lên 1 để load lại danh sách sau khi xóa
        setRefresh(prev => prev + 1);
      } else {
        alert('Không thể xóa sản phẩm này.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
    }
  };

  const filteredProducts = products.filter(p =>
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isManager ? 'Quản lý Sản phẩm' : 'Danh sách Sản phẩm'}</h2>

        {/* Chỉ Manager mới thấy nút Thêm sản phẩm */}
        {isManager && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <i className="bi bi-plus-lg me-1"></i> Thêm sản phẩm mới
          </button>
        )}
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="ps-3">ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Mô tả</th>
                  <th>Đơn giá (VNĐ)</th>
                  <th>Tồn kho</th>
                  <th>Ngưỡng đặt lại</th>
                  <th>Trạng thái</th>
                  {isManager && <th className="text-center pe-3">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr key={p.productId}>
                      <td className="ps-3">{p.productId}</td>
                      <td className="fw-bold text-primary">{p.productName}</td>
                      <td>{p.description}</td>
                      <td>{p.unitPrice?.toLocaleString('vi-VN')}</td>
                      <td>
                        <span className={`badge ${p.stockQuantity <= p.reorderLevel ? 'bg-danger' : 'bg-success'}`}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td>{p.reorderLevel}</td>
                      <td>
                        <span className={`badge ${p.status === 'Active' ? 'bg-info' : 'bg-secondary'}`}>
                          {p.status}
                        </span>
                      </td>
                      {isManager && (
                        <td className="text-center pe-3">
                          <button className="btn btn-sm btn-outline-warning me-2" onClick={() => handleOpenEdit(p)}>
                            Sửa
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.productId)}>
                            Xóa
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isManager ? "8" : "7"} className="text-center text-muted py-4">
                      Chưa có dữ liệu sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && isManager && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">{isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Tên sản phẩm</label>
                    <input type="text" className="form-control" name="productName" value={formData.productName} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mô tả</label>
                    <textarea className="form-control" name="description" rows="2" value={formData.description} onChange={handleChange}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Đơn giá</label>
                      <input type="number" className="form-control" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Số lượng tồn</label>
                      <input type="number" className="form-control" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Ngưỡng đặt lại (Reorder)</label>
                      <input type="number" className="form-control" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Trạng thái</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary px-4">{isEdit ? 'Lưu thay đổi' : 'Tạo mới'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}