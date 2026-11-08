import { useState, useEffect } from 'react';
import { useManagerSearchFilter } from '../../../components/ManagerSearchFilter';

const SUPPLIER_API_URL = '/api/suppliers';
const PRODUCT_API_URL = '/api/products';

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierPrices, setSupplierPrices] = useState([]);
  const [priceError, setPriceError] = useState('');
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
        } else {
          throw new Error('Không thể tải danh sách nhà cung cấp.');
        }

        const [resProducts, resPrices] = await Promise.all([
          fetch(PRODUCT_API_URL, { credentials: 'include' }),
          fetch('/api/supplier-prices', { credentials: 'include' }),
        ]);
        if (!resProducts.ok || !resPrices.ok) {
          throw new Error('Không thể tải sản phẩm hoặc bảng giá nhà cung cấp.');
        }
        const [prodData, priceData] = await Promise.all([
          resProducts.json(),
          resPrices.json(),
        ]);
        setProducts(Array.isArray(prodData) ? prodData : []);
        setSupplierPrices(Array.isArray(priceData) ? priceData : []);

      } catch (err) {
        setPriceError(err.message || 'Lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refresh]);

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

  const { filteredRows: filteredSuppliers, toolbar } = useManagerSearchFilter(
    suppliers,
    [
      { key: 'supplier_name', label: 'Nhà cung cấp', getValue: (supplier) => supplier.supplier_name || supplier.supplierName || supplier.name },
      { key: 'phone', label: 'Số điện thoại', filterable: false },
      { key: 'email', label: 'Email', filterable: false },
      { key: 'status', label: 'Trạng thái', formatValue: (value) => value === 'Active' ? 'Đang hoạt động' : 'Không hoạt động' },
    ],
    'Tìm theo tên, số điện thoại hoặc email...',
  );
  const selectedSupplierId = selectedSupplier
    ? selectedSupplier.supplier_id || selectedSupplier.supplierId || selectedSupplier.id
    : null;
  const supplierProducts = selectedSupplier
    ? products
        .filter((product) => product.status === 'Active')
        .map((product) => {
          const productId = product.productId || product.product_id || product.id;
          const price = supplierPrices.find(
            (item) =>
              Number(item.supplierId) === Number(selectedSupplierId) &&
              Number(item.productId) === Number(productId),
          );
          return { product, price };
        })
    : [];

  return (
    <div className="container-fluid py-4">
      {/* Tiêu đề & Nút Thêm mới */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="manager-page-title fw-bold">Quản lý nhà cung cấp</h2>
        <button
          className="btn text-white fw-bold shadow-sm"
          style={{ backgroundColor: '#800020' }}
          onClick={handleOpenAdd}
        >
          <i className="bi bi-plus-lg me-1"></i> Thêm nhà cung cấp mới
        </button>
      </div>

      <div className="manager-list-toolbar mb-4">{toolbar}</div>
      {priceError && !selectedSupplier && (
        <div className="alert alert-danger" role="alert">{priceError}</div>
      )}

      {/* Bảng danh sách nhà cung cấp */}
      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 manager-list-table">
              <thead style={{ backgroundColor: '#800020', color: '#ffffff' }}>
                <tr>
                  <th className="py-3">Tên nhà cung cấp</th>
                  <th className="py-3">Số điện thoại</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="text-center pe-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">
                      Đang tải dữ liệu nhà cung cấp...
                    </td>
                  </tr>
                ) : filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => {
                    const id = s.supplier_id || s.supplierId || s.id;
                    const name = s.supplier_name || s.supplierName || s.name;
                    return (
                      <tr key={id}>
                        <td className="fw-bold text-dark">
                          {name}
                          <div className="small text-muted">#{id}</div>
                        </td>
                        <td>{s.phone || 'Chưa cập nhật'}</td>
                        <td>
                          <span className={`badge ${s.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {s.status || 'Active'}
                          </span>
                        </td>
                        <td className="text-center pe-3">
                          <div className="manager-list-actions">
                          <button
                            className="manager-list-action manager-list-action--view"
                            onClick={() => {
                              setPriceError('');
                              setSelectedSupplier(s);
                            }}
                          >
                            <i className="bi bi-eye-fill" aria-hidden="true" /> Xem
                          </button>
                          <button
                            className="manager-list-action manager-list-action--edit"
                            onClick={() => handleOpenEdit(s)}
                          >
                            <i className="bi bi-pencil-square" aria-hidden="true" /> Sửa
                          </button>
                          <button
                            className="manager-list-action manager-list-action--delete"
                            onClick={() => handleDelete(id)}
                          >
                            <i className="bi bi-trash" aria-hidden="true" /> Xóa
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
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

                <h6 className="fw-bold mb-1" style={{ color: '#800020' }}>
                  <i className="bi bi-tags me-2"></i>Giá sản phẩm từ nhà cung cấp
                </h6>
                <p className="text-muted small mb-3">
                  Danh sách giá đã thỏa thuận với nhà cung cấp.
                </p>
                {priceError && <div className="alert alert-danger py-2" role="alert">{priceError}</div>}
                <div className="table-responsive rounded border">
                  <table className="table table-sm table-hover mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-3 py-2">Sản phẩm</th>
                        <th className="py-2">Đơn vị</th>
                        <th className="py-2 text-end pe-3">Giá đã thỏa thuận (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierProducts.map(({ price, product }) => {
                        const productId = product.productId || product.product_id || product.id;
                        return (
                          <tr key={productId}>
                            <td className="ps-3 fw-semibold">{product.productName || product.product_name}</td>
                            <td>{product.unit || '—'}</td>
                            <td className="text-end pe-3">
                              {price ? Number(price.unitPrice).toLocaleString('vi-VN') : 'Chưa có giá'}
                            </td>
                          </tr>
                        );
                      })}
                      {loading && (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            Đang tải bảng giá...
                          </td>
                        </tr>
                      )}
                      {!loading && supplierProducts.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center text-muted py-3">
                            Chưa có sản phẩm đang kinh doanh.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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