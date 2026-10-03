import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProductList from './ProductList';
import SupplierList from './SupplierList';

function App() {
  return (
    <BrowserRouter>
      {/* Thanh Menu Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">Beauty Salon Admin</Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/products">Quản Lý Products</Link>
            <Link className="nav-link" to="/suppliers">Quản Lý Suppliers</Link>
          </div>
        </div>
      </nav>

      {/* Nội dung trang theo Route */}
      <div className="container">
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/suppliers" element={<SupplierList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;