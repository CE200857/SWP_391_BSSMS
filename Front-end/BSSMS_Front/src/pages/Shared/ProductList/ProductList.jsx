import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080/BSSMS-back/api/products';
const SUPPLIER_API_URL = 'http://localhost:8080/BSSMS-back/api/suppliers';
const PURCHASE_ORDER_API_URL = 'http://localhost:8080/BSSMS-back/PurchaseOrderServlet';

export default function ProductList() {
  const [viewMode, setViewMode] = useState('list');

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  const [formData, setFormData] = useState({
    productId: 0,
    productName: '',
    description: '',
    unitPrice: 0,
    stockQuantity: 0,
    reorderLevel: 0,
    supplierId: '',
    status: 'Active'
  });

  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNote, setPoNote] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [submittingPO, setSubmittingPO] = useState(false);

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const resProducts = await fetch(API_URL, { credentials: 'include' });

        if (resProducts.ok) {
          const data = await resProducts.json();
          setProducts(Array.isArray(data) ? data : []);
        } else {
          console.error('Lỗi API Products status:', resProducts.status);
        }

        try {
          const resSuppliers = await fetch(SUPPLIER_API_URL, { credentials: 'include' });
          if (resSuppliers.ok) {
            const supplierData = await resSuppliers.json();
            setSuppliers(Array.isArray(supplierData) ? supplierData : []);
          }
        } catch (supErr) {
          console.warn('Không thể tải danh sách Supplier từ API:', supErr);
        }

      } catch (err) {
        console.error('Lỗi khi tải dữ liệu sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refresh]);

  const getSupplierName = (product) => {
    if (!product) return 'Chưa cập nhật';
    if (product.supplierName) return product.supplierName;
    if (product.supplier?.supplierName) return product.supplier.supplierName;

    const targetId = product.supplierId || product.supplier_id || product.supplier?.supplierId;
    if (targetId && suppliers.length > 0) {
      const found = suppliers.find(s => Number(s.supplierId || s.id) === Number(targetId));
      if (found) return found.supplierName || found.name;
    }

    return 'Chưa cập nhật';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['unitPrice', 'stockQuantity', 'reorderLevel', 'supplierId'];

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? (value === '' ? '' : Number(value))
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
      supplierId: suppliers.length > 0 ? (suppliers[0].supplierId || suppliers[0].id) : '',
      status: 'Active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setIsEdit(true);
    setFormData({
      ...product,
      supplierId: product.supplierId || product.supplier?.supplierId || ''
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
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (res.ok) {
        setShowModal(false);
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
      const res = await fetch(`${API_URL}?id=${id}`, { 
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setRefresh(prev => prev + 1);
      } else {
        alert('Không thể xóa sản phẩm này.');
      }
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
    }
  };

  const handleOpenPurchaseOrder = () => {
    setPoSupplierId(suppliers.length > 0 ? (suppliers[0].supplierId || suppliers[0].id) : '');
    setPoNote('');
    if (products.length > 0) {
      const firstProd = products[0];
      setPoItems([{
        productId: firstProd.productId,
        quantity: 1,
        importPrice: firstProd.unitPrice ? Math.round(firstProd.unitPrice * 0.7) : 0
      }]);
    } else {
      setPoItems([]);
    }
    setViewMode('purchase');
  };

  const handleAddPoItem = () => {
    if (products.length === 0) {
      alert('Chưa có sản phẩm nào trong hệ thống!');
      return;
    }
    const defaultProduct = products[0];
    setPoItems(prev => [
      ...prev,
      {
        productId: defaultProduct.productId,
        quantity: 1,
        importPrice: defaultProduct.unitPrice ? Math.round(defaultProduct.unitPrice * 0.7) : 0
      }
    ]);
  };

  const handleRemovePoItem = (index) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handlePoItemChange = (index, field, value) => {
    setPoItems(prev => {
      const updated = [...prev];
      if (field === 'productId') {
        const prod = products.find(p => Number(p.productId) === Number(value));
        updated[index] = {
          ...updated[index],
          productId: Number(value),
          importPrice: prod?.unitPrice ? Math.round(prod.unitPrice * 0.7) : updated[index].importPrice
        };
      } else if (field === 'quantity' || field === 'importPrice') {
        updated[index] = {
          ...updated[index],
          [field]: Math.max(0, Number(value))
        };
      }
      return updated;
    });
  };

  const calculateTotalPoAmount = () => {
    return poItems.reduce((total, item) => total + (item.quantity * item.importPrice), 0);
  };

  const handleSubmitPurchaseOrder = async (e) => {
    e.preventDefault();
    if (!poSupplierId) {
      alert('Vui lòng chọn Nhà cung cấp!');
      return;
    }
    if (poItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để nhập hàng!');
      return;
    }

    setSubmittingPO(true);
    const poPayload = {
      supplierId: Number(poSupplierId),
      note: poNote,
      totalAmount: calculateTotalPoAmount(),
      items: poItems
    };

    try {
      const res = await fetch(PURCHASE_ORDER_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poPayload),
        credentials: 'include'
      });

      if (res.ok) {
        alert('Tạo đơn nhập hàng thành công!');
        setViewMode('list');
        setRefresh(prev => prev + 1);
      } else {
        alert('Có lỗi xảy ra khi tạo đơn nhập hàng.');
      }
    } catch (err) {
      console.error('Lỗi khi gửi đơn nhập hàng:', err);
      alert('Không thể kết nối đến server.');
    } finally {
      setSubmittingPO(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewMode === 'purchase') {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setViewMode('list')}
          >
            ← Quay lại Quản lý sản phẩm
          </button>
          <h2 className="fw-bold mb-0" style={{ color: '#800020' }}>Tạo Đơn Nhập Hàng Mới (Purchase Order)</h2>
        </div>

        <div className="card shadow-sm border-0 rounded-3 p-4">
          <form onSubmit={handleSubmitPurchaseOrder}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Nhà Cung Cấp <span className="text-danger">*</span></label>
                <select 
                  className="form-select"
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.supplierId || s.id} value={s.supplierId || s.id}>
                      {s.supplierName || s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Ghi Chú Đơn Nhập</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ví dụ: Nhập bổ sung hàng tồn kho tháng..."
                  value={poNote}
                  onChange={(e) => setPoNote(e.target.value)}
                />
              </div>
            </div>

            <hr className="my-4" />

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#800020' }}>Danh Sách Sản Phẩm Nhập Hàng</h5>
              <button 
                type="button" 
                className="btn btn-sm text-white fw-bold"
                style={{ backgroundColor: '#800020' }}
                onClick={handleAddPoItem}
              >
                + Thêm sản phẩm
              </button>
            </div>

            {poItems.length === 0 ? (
              <div className="alert alert-light text-center border text-muted py-4 mb-4">
                Chưa chọn sản phẩm nào. Hãy bấm nút <strong>"+ Thêm sản phẩm"</strong> để thêm sản phẩm vào đơn nhập.
              </div>
            ) : (
              <div className="table-responsive mb-4">
                <table className="table table-bordered align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '40%' }}>Sản phẩm</th>
                      <th style={{ width: '20%' }}>Số lượng nhập</th>
                      <th style={{ width: '20%' }}>Giá nhập (VNĐ)</th>
                      <th style={{ width: '15%' }} className="text-end">Thành tiền</th>
                      <th style={{ width: '5%' }} className="text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, index) => {
                      const itemTotal = (item.quantity || 0) * (item.importPrice || 0);
                      return (
                        <tr key={index}>
                          <td>
                            <select 
                              className="form-select"
                              value={item.productId}
                              onChange={(e) => handlePoItemChange(index, 'productId', e.target.value)}
                            >
                              {products.map((p) => (
                                <option key={p.productId} value={p.productId}>
                                  {p.productName} (Tồn kho hiện tại: {p.stockQuantity})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="1" 
                              className="form-control"
                              value={item.quantity}
                              onChange={(e) => handlePoItemChange(index, 'quantity', e.target.value)}
                            />
                          </td>
                          <td>
                            <input 
                              type="number" 
                              min="0" 
                              className="form-control"
                              value={item.importPrice}
                              onChange={(e) => handlePoItemChange(index, 'importPrice', e.target.value)}
                            />
                          </td>
                          <td className="text-end fw-bold text-danger">
                            {itemTotal.toLocaleString('vi-VN')}
                          </td>
                          <td className="text-center">
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemovePoItem(index)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end fw-bold fs-5">Tổng Số Tiền Nhập Hàng:</td>
                      <td className="text-end fw-bold fs-5 text-danger">
                        {calculateTotalPoAmount().toLocaleString('vi-VN')} VNĐ
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-secondary px-4"
                onClick={() => setViewMode('list')}
              >
                Hủy
              </button>
              <button 
                type="submit" 
                className="btn text-white px-4 fw-bold"
                style={{ backgroundColor: '#800020' }}
                disabled={submittingPO}
              >
                {submittingPO ? 'Đang gửi...' : 'Xác Nhận Tạo Đơn Nhập'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold" style={{ color: '#800020' }}>Quản lý Sản phẩm</h2>

        <div className="d-flex gap-2">
          <button 
            className="btn text-white fw-bold shadow-sm" 
            style={{ backgroundColor: '#800020' }}
            onClick={handleOpenPurchaseOrder}
          >
            <i className="bi bi-cart-plus me-1"></i> Tạo đơn nhập hàng
          </button>

          <button 
            className="btn text-white fw-bold shadow-sm" 
            style={{ backgroundColor: '#800020' }}
            onClick={() => window.location.href = '/manager/suppliers'}
          >
            <i className="bi bi-truck me-1"></i> Quản lý Nhà cung cấp
          </button>

          <button 
            className="btn text-white fw-bold shadow-sm" 
            style={{ backgroundColor: '#800020' }}
            onClick={handleOpenAdd}
          >
            <i className="bi bi-plus-lg me-1"></i> Thêm sản phẩm mới
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control shadow-sm"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ backgroundColor: '#800020', color: '#ffffff' }}>
                <tr>
                  <th className="ps-3 py-3">ID</th>
                  <th className="py-3">Tên sản phẩm</th>
                  <th className="py-3">Đơn giá (VNĐ)</th>
                  <th className="py-3">Tồn kho</th>
                  <th className="py-3">Ngưỡng đặt lại</th>
                  <th className="py-3">Trạng thái</th>
                  <th className="text-center pe-3 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">Đang tải dữ liệu sản phẩm...</td>
                  </tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr key={p.productId}>
                      <td className="ps-3 font-monospace">#{p.productId}</td>
                      <td className="fw-bold text-dark">{p.productName}</td>
                      <td className="fw-semibold text-danger">
                        {p.unitPrice ? p.unitPrice.toLocaleString('vi-VN') : '0'}
                      </td>
                      <td>
                        <span className={`badge ${p.stockQuantity <= p.reorderLevel ? 'bg-danger' : 'bg-success'}`}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td>{p.reorderLevel}</td>
                      <td>
                        <span className={`badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="text-center pe-3">
                        <button
                          className="btn btn-sm btn-outline-info me-2"
                          onClick={() => setSelectedProductDetail(p)}
                        >
                          Xem
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-warning me-2" 
                          onClick={() => handleOpenEdit(p)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(p.productId)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      Chưa có dữ liệu sản phẩm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedProductDetail && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header text-white" style={{ backgroundColor: '#800020' }}>
                <h5 className="modal-title fw-bold">Chi Tiết Sản Phẩm: {selectedProductDetail.productName}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedProductDetail(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-2"><strong>Mã sản phẩm:</strong> {selectedProductDetail.productId}</p>
                <p className="mb-2"><strong>Nhà cung cấp:</strong> {getSupplierName(selectedProductDetail)}</p>
                <p className="mb-2"><strong>Đơn giá:</strong> {selectedProductDetail.unitPrice?.toLocaleString('vi-VN')} VNĐ</p>
                <p className="mb-2"><strong>Số lượng tồn:</strong> {selectedProductDetail.stockQuantity}</p>
                <p className="mb-2"><strong>Ngưỡng đặt lại:</strong> {selectedProductDetail.reorderLevel}</p>
                <p className="mb-2"><strong>Trạng thái:</strong> {selectedProductDetail.status}</p>
                <hr />
                <p className="fw-bold mb-1">Mô tả sản phẩm:</p>
                <p className="text-secondary mb-0" style={{ whiteSpace: 'pre-line' }}>
                  {selectedProductDetail.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
                </p>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary px-4" onClick={() => setSelectedProductDetail(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold" style={{ color: '#800020' }}>
                  {isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Tên sản phẩm</label>
                    <input type="text" className="form-control" name="productName" value={formData.productName} onChange={handleChange} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Nhà cung cấp</label>
                    <select 
                      className="form-select" 
                      name="supplierId" 
                      value={formData.supplierId} 
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn Nhà cung cấp --</option>
                      {suppliers.map((s) => (
                        <option key={s.supplierId || s.id} value={s.supplierId || s.id}>
                          {s.supplierName || s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Mô tả</label>
                    <textarea className="form-control" name="description" rows="2" value={formData.description} onChange={handleChange}></textarea>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Đơn giá</label>
                      <input type="number" min="0" className="form-control" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Số lượng tồn</label>
                      <input type="number" min="0" className="form-control" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">Ngưỡng đặt lại (Reorder)</label>
                      <input type="number" min="0" className="form-control" name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} required />
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