import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080/BSSMS-back/api/products';
export default function ProductList() {
  const [products, setProducts] = useState([]);
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

  // 1. Fetch danh sách sản phẩm
  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Lỗi kết nối API Product:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Thay đổi input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'unitPrice' || name === 'stockQuantity' || name === 'reorderLevel' 
        ? Number(value) 
        : value
    }));
  };

  // Mở modal Thêm mới
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

  // Mở modal Sửa
  const handleOpenEdit = (product) => {
    setIsEdit(true);
    setFormData(product);
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
        fetchProducts();
      } else {
        alert('Có lỗi xảy ra khi lưu thông tin sản phẩm.');
      }
    } catch (err) {
      console.error('Lỗi khi gửi request:', err);
    }
  };

  // Xóa sản phẩm
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Không thể xóa sản phẩm này.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý Sản phẩm</h2>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + Thêm sản phẩm mới
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Mô tả</th>
                  <th>Đơn giá (VNĐ)</th>
                  <th>Tồn kho</th>
                  <th>Ngưỡng đặt lại</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? (
                  products.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.productId}</td>
                      <td className="fw-bold">{p.productName}</td>
                      <td>{p.description}</td>
                      <td>{p.unitPrice?.toLocaleString()}</td>
                      <td>{p.stockQuantity}</td>
                      <td>{p.reorderLevel}</td>
                      <td>
                        <span className={`badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenEdit(p)}>
                          Sửa
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.productId)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted">Chưa có dữ liệu sản phẩm</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Thêm/Sửa */}
      {showModal && (
        <div className="modal show d-block tab-index='-1'" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên sản phẩm</label>
                    <input type="text" className="form-control" name="productName" value={formData.productName} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-control" name="description" rows="2" value={formData.description} onChange={handleChange}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Đơn giá</label>
                      <input type="number" className="form-control" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Số lượng tồn</label>
                      <input type="number" className="form-control" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Ngưỡng đặt lại</label>
                      <input type="number" className="form-control" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Trạng thái</label>
                      <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">{isEdit ? 'Lưu thay đổi' : 'Tạo mới'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}