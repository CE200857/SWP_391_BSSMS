import React, { useEffect, useState } from 'react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // State lưu thông tin Form
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    description: '',
    unitPrice: '',
    stockQuantity: '',
    status: 'Active'
  });

  const API_URL = 'http://localhost:8080/BeautySalon_Backend/api/products';

  // Lấy danh sách sản phẩm (View Product)
  const fetchProducts = () => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => console.error('Lỗi API:', err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Mở Form Thêm Mới (Create Product)
  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({ productId: '', productName: '', description: '', unitPrice: '', stockQuantity: '', status: 'Active' });
    setShowModal(true);
  };

  // Mở Form Cập Nhật (Update Product)
  const handleOpenEdit = (product) => {
    setIsEdit(true);
    setFormData(product);
    setShowModal(true);
  };

  // Xử lý Xóa (Delete Product)
  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        .then(() => fetchProducts())
        .catch((err) => console.error('Lỗi xóa sản phẩm:', err));
    }
  };

  // Xử lý Submit Form (Create / Update)
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
        fetchProducts();
      })
      .catch((err) => console.error('Lỗi lưu sản phẩm:', err));
  };

  if (loading) return <div className="text-center p-4">Đang tải dữ liệu...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Quản Lý Sản Phẩm</h2>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Create Product
        </button>
      </div>

      {/* Bảng Danh Sách Products (View Product) */}
      <table className="table table-bordered table-hover align-middle">
        <thead className="table-dark text-center">
          <tr>
            <th>ID</th>
            <th>Tên sản phẩm</th>
            <th>Mô tả</th>
            <th>Giá</th>
            <th>Số lượng</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.productId}>
              <td className="text-center">{p.productId}</td>
              <td className="fw-bold">{p.productName}</td>
              <td>{p.description}</td>
              <td>{Number(p.unitPrice).toLocaleString()} VNĐ</td>
              <td className="text-center">{p.stockQuantity}</td>
              <td className="text-center">
                <span className={`badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                  {p.status}
                </span>
              </td>
              <td className="text-center">
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenEdit(p)}>
                  Update
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.productId)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Form Thêm/Sửa Sản Phẩm */}
      {showModal && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{isEdit ? 'Update Product' : 'Create Product'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Tên sản phẩm</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Giá (VNĐ)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Số lượng kho</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
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

export default ProductList;