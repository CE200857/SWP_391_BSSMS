import React, { useState, useEffect } from 'react';

export default function ManageStock() {
    const [products, setProducts] = useState([]);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newStock, setNewStock] = useState(0);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
  try {
    // Gọi đúng API endpoint đã định nghĩa trong Servlet
    const res = await fetch('http://localhost:8080/BSSMS-back/api/products');
    
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    
    const data = await res.json();
    setProducts(data);
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
};

    const handleUpdateStock = async (productId) => {
        try {
            const res = await fetch('http://localhost:8080/BSSMS/api/stock', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, stockQuantity: Number(newStock) })
            });
            if (res.ok) {
                alert('Cập nhật số lượng tồn kho thành công!');
                setEditingProduct(null);
                fetchProducts();
            } else {
                alert('Cập nhật thất bại!');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Quản Lý Tồn Kho (Manage Stock)</h2>
            <table className="table table-bordered mt-3 align-middle">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Tên Sản Phẩm</th>
                        <th>Số Lượng Tồn Kho</th>
                        <th>Mức Cảnh Báo</th>
                        <th>Trạng Thái Kho</th>
                        <th>Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p.productId}>
                            <td>{p.productId}</td>
                            <td>{p.productName}</td>
                            <td>
                                {editingProduct === p.productId ? (
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={newStock}
                                        onChange={(e) => setNewStock(e.target.value)}
                                    />
                                ) : (
                                    <strong>{p.stockQuantity}</strong>
                                )}
                            </td>
                            <td>{p.reorderLevel}</td>
                            <td>
                                {p.stockQuantity <= p.reorderLevel ? (
                                    <span className="badge bg-danger">Cần nhập thêm</span>
                                ) : (
                                    <span className="badge bg-success">An toàn</span>
                                )}
                            </td>
                            <td>
                                {editingProduct === p.productId ? (
                                    <>
                                        <button className="btn btn-sm btn-success me-2" onClick={() => handleUpdateStock(p.productId)}>Lưu</button>
                                        <button className="btn btn-sm btn-secondary" onClick={() => setEditingProduct(null)}>Hủy</button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => {
                                            setEditingProduct(p.productId);
                                            setNewStock(p.stockQuantity);
                                        }}
                                    >
                                        Sửa Tồn Kho
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}