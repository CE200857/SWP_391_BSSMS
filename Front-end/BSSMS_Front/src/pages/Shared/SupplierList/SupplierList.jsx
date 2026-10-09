import { useState, useEffect } from 'react';

const SUPPLIER_API_URL = 'http://localhost:8080/BSSMS-back/api/suppliers';
const PRODUCT_API_URL = 'http://localhost:8080/BSSMS-back/api/products';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal Chi tiết Nhà cung cấp
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Modal Thêm / Sửa
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: 0,
    supplier_name: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active'
  });

  const [refresh, setRefresh] = useState(0);

  // Fetch dữ liệu Nhà cung cấp & Sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Tải danh sách Supplier
        const resSuppliers = await fetch(SUPPLIER_API_URL, { credentials: 'include' });
        if (resSuppliers.ok) {
          const supData = await resSuppliers.json();
          setSuppliers(Array.isArray(supData) ? supData : []);
        }

        // 2. Tải danh sách Products
        try {
          const resProducts = await fetch(PRODUCT_API_URL, { credentials: 'include' });
          if (resProducts.ok) {
            const prodData = await resProducts.json();
            setProducts(Array.isArray(prodData) ? prodData : []);
          }
        } catch (pErr) {
          console.warn('Không thể tải danh sách sản phẩm:', pErr);
        }

      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refresh]);

  // Bắt cặp danh sách sản phẩm liên kết với Supplier
  const getSuppliedProducts = (supplier) => {
    if (!supplier || !products || products.length === 0) return [];

    const supId = supplier.supplier_id ?? supplier.supplierId ?? supplier.id;
    const supName = (supplier.supplier_name || supplier.supplierName || supplier.name || '').toLowerCase().trim();

    return products.filter((p) => {
      // 1. So sánh ID nếu Backend có map sẵn field
      const pSupId = p.supplier_id ?? p.supplierId ?? p.supplier?.supplier_id ?? p.supplier?.supplierId ?? p.supplier?.id;
      if (pSupId !== undefined && pSupId !== null && String(pSupId) === String(supId)) {
        return true;
      }

      // 2. So sánh tên nhà cung cấp nếu có
      const pSupName = (p.supplier_name || p.supplierName || p.supplier?.supplier_name || p.supplier?.supplierName || '').toLowerCase().trim();
      if (pSupName && supName && pSupName === supName) {
        return true;
      }

      return false;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({
      supplier_id: 0,
      supplier_name: '',
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
      supplier_id: supplier.supplier_id || supplier.supplierId || supplier.id,
      supplier_name: supplier.supplier_name || supplier.supplierName || supplier.name || '',
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

    // Payload chuẩn theo tên cột CSDL SQL Server: supplier_name, phone, email, address, status
    const payload = {
      supplier_id: formData.supplier_id,
      supplier_name: formData.supplier_name,
      supplierName: formData.supplier_name, // Dự phòng cho DTO Java
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      status: formData.status
    };

    try {
      const res = await fetch(SUPPLIER_API_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (res.ok) {
        setShowModal(false);
        setRefresh((prev) => prev + 1);
      } else {
        alert('Có lỗi xảy ra khi lưu nhà cung cấp.');
      }
    } catch (err) {
      console.error('Lỗi khi lưu nhà cung cấp:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;

    try {
      const res = await fetch(`${SUPPLIER_API_URL}?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setRefresh((prev) => prev + 1);
      } else {
        alert('Không thể xóa nhà cung cấp này.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa nhà cung cấp:', err);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const name = s.supplier_name || s.supplierName || s.name || '';
    const phone = s.phone || '';
    const email = s.email || '';
    const term = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(term) ||
      phone.toLowerCase().includes(term) ||
      email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container-fluid py-4">
      {/* Tiêu đề & Nút Thêm mới */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#800020' }}>Quản lý Nhà cung cấp</h2>
        <button
          className="btn text-white fw-bold shadow-sm"
          style={{ backgroundColor: '#800020' }}
          onClick={handleOpenAdd}
        >
          <i className="bi bi-plus-lg me-1"></i> Thêm nhà cung cấp mới
        </button>
      </div>

      {/* Ô tìm kiếm */}
      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control shadow-sm"
            placeholder="Tìm kiếm theo tên, SĐT, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng danh sách nhà cung cấp */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#800020', color: '#ffffff' }}>
                <tr>
                  <th className="ps-3 py-3">ID</th>
                  <th className="py-3">Tên nhà cung cấp</th>
                  <th className="py-3">Số điện thoại</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Địa chỉ</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="text-center pe-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Đang tải dữ liệu nhà cung cấp...
                    </td>
                  </tr>
                ) : filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => {
                    const id = s.supplier_id || s.supplierId || s.id;
                    const name = s.supplier_name || s.supplierName || s.name;
                    return (
                      <tr key={id}>
                        <td className="ps-3 font-monospace">#{id}</td>
                        <td className="fw-bold text-dark">{name}</td>
                        <td>{s.phone || 'Chưa cập nhật'}</td>
                        <td>{s.email || 'Chưa cập nhật'}</td>
                        <td>{s.address || 'Chưa cập nhật'}</td>
                        <td>
                          <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {s.status || 'Active'}
                          </span>
                        </td>
                        <td className="text-center pe-3">
                          <button
                            className="btn btn-sm btn-outline-info me-2"
                            onClick={() => setSelectedSupplier(s)}
                          >
                            Xem
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning me-2"
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
                    <td colSpan="7" className="text-center text-muted py-4">
                      Chưa có dữ liệu nhà cung cấp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT NHÀ CUNG CẤP & SẢN PHẨM CUNG CẤP */}
      {selectedSupplier && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              
              <div className="modal-header text-white" style={{ backgroundColor: '#800020' }}>
                <h5 className="modal-title fw-bold text-white">
                  Chi Tiết Nhà Cung Cấp: {selectedSupplier.supplier_name || selectedSupplier.supplierName || selectedSupplier.name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedSupplier(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row mb-3">
                  <div className="col-md-6 mb-2">
                    <strong>Mã nhà cung cấp:</strong> #{selectedSupplier.supplier_id || selectedSupplier.supplierId || selectedSupplier.id}
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>Trạng thái:</strong>{' '}
                    <span className={`badge ${selectedSupplier.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedSupplier.status || 'Active'}
                    </span>
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>Số điện thoại:</strong> {selectedSupplier.phone || 'Chưa cập nhật'}
                  </div>
                  <div className="col-md-6 mb-2">
                    <strong>Email:</strong> {selectedSupplier.email || 'Chưa cập nhật'}
                  </div>
                  <div className="col-12 mb-2">
                    <strong>Địa chỉ:</strong> {selectedSupplier.address || 'Chưa cập nhật'}
                  </div>
                </div>

                <hr className="my-3" />

                <h6 className="fw-bold mb-3" style={{ color: '#800020' }}>
                  <i className="bi bi-box-seam me-2"></i>Các sản phẩm đang cung cấp
                </h6>

                {(() => {
                  const sProducts = getSuppliedProducts(selectedSupplier);
                  if (sProducts.length === 0) {
                    return (
                      <div className="alert alert-light border text-center text-muted py-3">
                        Nhà cung cấp này chưa phân phối sản phẩm nào trong hệ thống.
                      </div>
                    );
                  }
                  return (
                    <div className="table-responsive rounded border">
                      <table className="table table-sm table-striped table-hover mb-0 align-middle">
                        <thead className="bg-light">
                          <tr>
                            <th className="ps-3 py-2">Mã SP</th>
                            <th className="py-2">Tên sản phẩm</th>
                            <th className="py-2">Đơn giá (VNĐ)</th>
                            <th className="py-2">Số lượng tồn</th>
                            <th className="py-2">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sProducts.map((p) => {
                            const pId = p.product_id || p.productId || p.id;
                            const pName = p.product_name || p.productName;
                            const uPrice = p.unit_price || p.unitPrice;
                            const sQty = p.stock_quantity ?? p.stockQuantity ?? 0;
                            return (
                              <tr key={pId}>
                                <td className="ps-3 font-monospace">#{pId}</td>
                                <td className="fw-bold text-dark">{pName}</td>
                                <td className="text-danger fw-semibold">
                                  {uPrice ? uPrice.toLocaleString('vi-VN') : '0'}
                                </td>
                                <td>{sQty}</td>
                                <td>
                                  <span className={`badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {p.status || 'Active'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => setSelectedSupplier(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA NHÀ CUNG CẤP */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" style={{ color: '#800020' }}>
                  {isEdit ? 'Cập nhật Nhà cung cấp' : 'Thêm Nhà cung cấp mới'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Tên Nhà cung cấp</label>
                    <input
                      type="text"
                      className="form-control"
                      name="supplier_name"
                      value={formData.supplier_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Số điện thoại</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Địa chỉ</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Trạng thái</label>
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
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn text-white px-4" style={{ backgroundColor: '#800020' }}>
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