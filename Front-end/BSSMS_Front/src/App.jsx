import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";

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

const ProtectedAppointmentRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const allowedRoles = [
    "Customer",
    "Receptionist",
    "Technician",
    "Manager"
  ];

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const ProtectedRescheduleRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const allowedRoles = [
    "Customer",
    "Receptionist",
    "Manager"
  ];

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/appointments" replace />;
  }

  return children;
};

function App() {

  const [user, setUser] = useState(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  return (
    <BrowserRouter>
      <div
        className="bg-light min-vh-100 vw-100 d-flex m-0 p-0"
        style={{ overflowX: "hidden" }}
      >
        <Sidebar user={user} />

        <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>

          <Header user={user} />

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
      </div>
    </BrowserRouter>
  );
}

export default App;
