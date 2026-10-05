import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import CustomerList from "./pages/Dashboard/Manager/CustomerAdmin/CustomerList";
import StaffList from "./pages/Dashboard/Manager/StaffAdmin/StaffList";
import ServiceList from "./pages/Shared/ServiceList/ServiceList";
import ServiceForm from "./pages/Shared/ServiceList/ServiceForm";
import MyFeedbackList from "./pages/Shared/Feedback/MyFeedbackList";
import PublicFeedbackList from "./pages/Shared/Feedback/PublicFeedbackList";
import FeedbackForm from "./pages/Shared/Feedback/FeedbackForm";
import ProductList from "./pages/Shared/ProductList/ProductList";
import "./App.css";

const ProtectedCustomerRoute = ({ user, children }) => {
    if (!user) {
        return <Navigate to="/" replace />;
    }
    if (user.role !== "Customer") {
        return <Navigate to="/feedback" replace />;
    }
    return children;
};

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
            <div
                className="bg-light min-vh-100 vw-100 d-flex m-0 p-0"
                style={{ overflowX: "hidden" }}
            >
                <Sidebar user={user} />

                <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
                    <Header user={user} />

                    <Routes>
                        {/* Trang đăng nhập */}
                        <Route path="/" element={<Login setUser={setUser} />} />

                        {/* Trang Profile */}
                        <Route path="/profile" element={<Profile user={user} />} />

                        {/* Route Sản phẩm (Mở cho tất cả user đã đăng nhập, tự điều chỉnh UI theo role) */}
                        <Route
                            path="/products"
                            element={<ProductList userRole={user?.role || "Customer"} />}
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

                        {/* Route Quản lý dịch vụ (Chỉ dành cho Staff/Manager) */}
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

                        {/* Xem đánh giá từ khách hàng */}
                        <Route
                            path="/feedback"
                            element={
                                <ProtectedStaffRoute user={user}>
                                    <PublicFeedbackList />
                                </ProtectedStaffRoute>
                            }
                        />

                        {/* Quản lý đánh giá cá nhân (Chỉ dành cho Customer) */}
                        <Route
                            path="/my-feedback"
                            element={
                                <ProtectedCustomerRoute user={user}>
                                    <MyFeedbackList />
                                </ProtectedCustomerRoute>
                            }
                        />
                        <Route
                            path="/feedback/new"
                            element={
                                <ProtectedCustomerRoute user={user}>
                                    <FeedbackForm />
                                </ProtectedCustomerRoute>
                            }
                        />
                        <Route
                            path="/feedback/edit/:id"
                            element={
                                <ProtectedCustomerRoute user={user}>
                                    <FeedbackForm />
                                </ProtectedCustomerRoute>
                            }
                        />
                    </Routes>

                    <Footer />
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;