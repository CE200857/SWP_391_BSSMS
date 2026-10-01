import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import CustomerList from "./pages/Dashboard/CustomerAdmin/CustomerList";
import StaffList from "./pages/Dashboard/StaffAdmin/StaffList";
import ServiceForm from "./pages/Dashboard/ServiceList/ServiceForm";
import ServiceList from "./pages/Dashboard/ServiceList/ServiceList";
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

const AppLayout = ({ user, setUser }) => {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/";

  return (
    <div
      className="bg-light min-vh-100 vw-100 d-flex m-0 p-0"
      style={{ overflowX: "hidden" }}
    >
      {!isLoginPage && <Sidebar user={user} />}

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        {!isLoginPage && <Header user={user} />}

        <div className={`flex-grow-1 ${isLoginPage ? "" : "p-4"}`}>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  user.role === "Customer" ? (
                    <Navigate to="/profile" replace />
                  ) : (
                    <Navigate to="/customers" replace />
                  )
                ) : (
                  <Login setUser={setUser} />
                )
              }
            />

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

            <Route
              path="/customers"
              element={
                <ProtectedStaffRoute user={user}>
                  <CustomerList />
                </ProtectedStaffRoute>
              }
            />

            <Route
              path="/staffs"
              element={
                <ProtectedManagerRoute user={user}>
                  <StaffList />
                </ProtectedManagerRoute>
              }
            />

            <Route
              path="/services"
              element={
                <ProtectedStaffRoute user={user}>
                  <ServiceList />
                </ProtectedStaffRoute>
              }
            />

            <Route
              path="/services/new"
              element={
                <ProtectedStaffRoute user={user}>
                  <ServiceForm />
                </ProtectedStaffRoute>
              }
            />

            <Route
              path="/services/edit/:id"
              element={
                <ProtectedStaffRoute user={user}>
                  <ServiceForm />
                </ProtectedStaffRoute>
              }
            />
          </Routes>
        </div>

        {!isLoginPage && <Footer />}
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);

  // Giữ phiên đăng nhập khi nhấn F5 (Tải lại trang)
  useEffect(() => {
    const loggedInUser = localStorage.getItem("user");
    if (loggedInUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  return (
    <BrowserRouter>
      <AppLayout user={user} setUser={setUser} />
    </BrowserRouter>
  );
}

export default App;
