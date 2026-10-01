import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import CustomerList from "./pages/CustomerAdmin/CustomerList";
import StaffList from "./pages/StaffAdmin/StaffList";
import "./App.css";

const ProtectedStaffRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (user.role === "Customer") {
    return <Navigate to="/profile" replace />;
  }
  return children;
};

const ProtectedManagerRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== "Manager") {
    return <Navigate to="/customers" replace />;
  }

  return children;
};

function App() {

  const [user, setUser] = useState(() => {
    const loggedInUser = localStorage.getItem("user");
    return loggedInUser ? JSON.parse(loggedInUser) : null;
  });

  return (
    <BrowserRouter>
      <div className="bg-light min-vh-100 d-flex flex-column">
        <Header user={user} />

        <div className="flex-grow-1 pb-5">
          <Routes>
            {/* Route Đăng nhập (Mặc định) */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/customers" replace />
                ) : (
                  <Login setUser={setUser} />
                )
              }
            />

            {/* Route cho trang Hồ sơ cá nhân (Profile) */}
            <Route
              path="/profile"
              element={
                user ? (
                  <Profile user={user} setUser={setUser} />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* Route Quản lý danh sách khách hàng (Chỉ dành cho Staff/Manager) */}
            <Route
              path="/customers"
              element={
                <ProtectedStaffRoute user={user}>
                  <CustomerList />
                </ProtectedStaffRoute>
              }
            />

            {/* Route Quản lý danh sách nhân viên (Chỉ dành cho Manager) */}
            <Route
              path="/staffs"
              element={
                <ProtectedManagerRoute user={user}>
                  <StaffList />
                </ProtectedManagerRoute>
              }
            />

          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
