import React, { useState, useEffect } from 'react';

export default function PurchaseOrder() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { productId: '', quantity: 1, unitPrice: 0 }
  ]);

useEffect(() => {
  // 1. Tải danh sách Nhà cung cấp từ API
  fetch('http://localhost:8080/BSSMS-back/SupplierServlet')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch suppliers');
      return res.json();
    })
    .then((data) => setSuppliers(data))
    .catch((err) => console.error('Lỗi tải nhà cung cấp:', err));

  // 2. Tải danh sách Sản phẩm từ API
  fetch('http://localhost:8080/BSSMS-back/api/products')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    })
    .then((data) => setProducts(data))
    .catch((err) => console.error('Lỗi tải sản phẩm:', err));
}, []);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;

    // Tự động điền đơn giá nếu chọn sản phẩm
    if (field === 'productId') {
      const p = products.find(prod => prod.productId === Number(value));
      if (p) updated[index].unitPrice = p.unitPrice;
    }

    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Vui lòng chọn nhà cung cấp!');
      return;
    }

    const payload = {
      supplierId: Number(selectedSupplierId),
      totalAmount: calculateTotal(),
      items: orderItems.map(item => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      }))
    };

    try {
      const res = await fetch('http://localhost:8080/BSSMS/api/purchase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Tạo đơn nhập hàng thành công! Số lượng tồn kho đã được cộng tự động.');
        setOrderItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
        setSelectedSupplierId('');
      } else {
        alert('Tạo đơn nhập hàng thất bại!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4">Tạo Đơn Nhập Hàng</h3>
      <form onSubmit={handleSubmit} className="card shadow-sm p-4">
        <div className="mb-3">
          <label className="form-label fw-bold">Chọn Nhà Cung Cấp</label>
          <select
            className="form-select"
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            required
          >
            <option value="">-- Chọn Nhà Cung Cấp --</option>
            {suppliers.map((s) => (
              <option key={s.supplierId} value={s.supplierId}>
                {s.supplierName}
              </option>
            ))}
          </select>
        </div>

        <h5 className="fw-bold mt-4 mb-3">Chi Tiết Sản Phẩm Nhập</h5>
        {orderItems.map((item, index) => (
          <div key={index} className="row g-2 align-items-center mb-2">
            <div className="col-md-5">
              <select
                className="form-select"
                value={item.productId}
                onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                required
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.productName} (Tồn hiện tại: {p.stockQuantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="Số lượng"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Đơn giá nhập"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                required
              />
            </div>
            <div className="col-md-2">
              {orderItems.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger w-100"
                  onClick={() => handleRemoveItem(index)}
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-outline-secondary mt-2 mb-4" onClick={handleAddItem}>
          + Thêm sản phẩm
        </button>

        <div className="d-flex justify-content-between align-items-center border-top pt-3">
          <h5>Tổng tiền nhập: <strong className="text-primary">{calculateTotal().toLocaleString()} VNĐ</strong></h5>
          <button type="submit" className="btn btn-primary px-4">Tạo Đơn Nhập</button>
        </div>
      </form>
    </div>
  );
}