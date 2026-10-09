import { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

// Nhóm Auth & Guest
import GuestHome from "../pages/Homepages/Guest/GuestHome";
import Login from "../pages/Auth/Login";
import Profile from "../pages/Auth/Profile";
import Register from "../pages/Auth/Register";
import CreateProfile from "../pages/Auth/CreateProfile";
import ChangePassword from "../pages/Auth/ChangePassword";
import EditProfile from "../pages/Auth/EditProfile";

// Nhóm 4 Giao diện chính (Dashboard & Home)
import CustomerHome from "../pages/Homepages/Customer/CustomerHome";
import ManagerDashboard from "../pages/Dashboard/Manager/ManagerDashboard";
import ReceptionistDashboard from "../pages/Dashboard/Receptionist/ReceptionistDashboard";
import CreateWalkInCustomer from "../pages/Dashboard/Receptionist/CreateWalkInCustomer.jsx";
import TechnicianDashboard from "../pages/Dashboard/Technician/TechnicianDashboard";

// Nhóm Tính năng (Pages)
import CustomerList from "../pages/Dashboard/Manager/CustomerAdmin/CustomerList";
import StaffList from "../pages/Dashboard/Manager/StaffAdmin/StaffList";
import ServiceList from "../pages/Shared/ServiceList/ServiceList";
import ServiceForm from "../pages/Shared/ServiceList/ServiceForm";
import MyFeedbackList from "../pages/Shared/Feedback/MyFeedbackList";
import PublicFeedbackList from "../pages/Shared/Feedback/PublicFeedbackList";
import FeedbackForm from "../pages/Shared/Feedback/FeedbackForm";
import ProductList from "../pages/Shared/ProductList/ProductList";
import SupplierList from "../pages/Shared/SupplierList/SupplierList";

import AppointmentList from "../pages/Dashboard/Appointment/AppointmentList";
import AppointmentDetails from "../pages/Dashboard/Appointment/AppointmentDetails";
import RescheduleAppointment from "../pages/Dashboard/Appointment/RescheduleAppointment";
import TreatmentPackageList from "../pages/Dashboard/Manager/TreatmentPackageAdmin/TreatmentPackageList";

// Nhóm 5 chức năng mới
import TreatmentStatus from "../pages/Dashboard/Technician/TreatmentStatus";
import UpdateServiceStatus from "../pages/Dashboard/Manager/UpdateServiceStatus";
import UpdateRoomBedStatus from "../pages/Dashboard/Technician/UpdateRoomBedStatus";
import RecordTreatmentOutcome from "../pages/Dashboard/Technician/RecordTreatmentOutcome";
import SellTreatmentPackage from "../pages/Dashboard/Receptionist/SellTreatmentPackage";

// --- 1. HÀM BẢO VỆ ROUTE ĐA NĂNG ---
// Nhận vào mảng allowedRoles, nếu Role của user không nằm trong mảng này -> Bẻ lái về nhà
const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "Customer":
        return <Navigate to="/customer/home" replace />;
      case "Manager":
        return <Navigate to="/manager/dashboard" replace />;
      case "Receptionist":
        return <Navigate to="/receptionist/dashboard" replace />;
      case "Technician":
        return <Navigate to="/technician/dashboard" replace />;
      default:
        return <Navigate to="/bssms-guest" replace />;
    }
  }
  return children;
};

// --- 2. CÁC KHUNG GIAO DIỆN (LAYOUTS) ---
const GuestLayout = () => {
  return (
    <div className="app-guest-layout">
      <main className="app-guest-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const DashboardLayout = ({ user }) => {
  if (!user) return <Navigate to="/bssms-guest" replace />;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className="app-dashboard min-vh-100 vw-100 d-flex m-0 p-0"
      style={{ overflowX: "hidden" }}
    >
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <Header user={user} />
        <main className="app-dashboard-content p-3 flex-grow-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

// --- 3. ĐỊNH TUYẾN CHÍNH ---
export default function AppRoutes({ user, setUser }) {
  return (
    <Routes>
      {/* NHÁNH 1: KHÁCH VÃNG LAI (GUEST) */}
      <Route element={<GuestLayout />}>
        <Route path="/bssms-guest" element={<GuestHome />} />
        <Route path="/" element={<Navigate to="/bssms-guest" replace />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/update-profile"
          element={<CreateProfile setUser={setUser} />}
        />

        {/* Guest được phép View Services & View Other Customers' Feedback */}
        <Route path="/guest/services" element={<ServiceList />} />
        <Route
          path="/guest/services/:id"
          element={<ServiceForm isReadOnly={true} />}
        />
        <Route path="/guest/feedback" element={<PublicFeedbackList />} />
      </Route>

      {/* NHÁNH 2: KHUNG ĐÃ ĐĂNG NHẬP (CÓ SIDEBAR) */}
      <Route element={<DashboardLayout user={user} />}>

        {/* --- PROFILE: Tất cả Role nội bộ --- */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Manager", "Receptionist", "Technician"]}
            >
              <Profile user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Manager", "Receptionist", "Technician"]}
            >
              <ChangePassword />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Manager", "Receptionist", "Technician"]}
            >
              <EditProfile user={user} setUser={setUser} />
            </ProtectedRoute>
          }
        />

        {/* --- TRANG CHỦ THEO ROLE --- */}
        <Route
          path="/customer/home"
          element={
            <ProtectedRoute user={user} allowedRoles={["Customer"]}>
              <CustomerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receptionist/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={["Receptionist"]}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/technician/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={["Technician"]}>
              <TechnicianDashboard />
            </ProtectedRoute>
          }
        />

        {/* --- RECEPTIONIST: TẠO KHÁCH VÃNG LAI --- */}
        <Route
          path="/receptionist/create"
          element={
            <ProtectedRoute user={user} allowedRoles={["Receptionist"]}>
              <CreateWalkInCustomer />
            </ProtectedRoute>
          }
        />

        {/* --- ACCOUNT MANAGEMENT --- */}
        {/* View Customer Account: Receptionist & Manager */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Receptionist", "Manager"]}
            >
              <CustomerList />
            </ProtectedRoute>
          }
        />
        {/* Staff List: Chỉ Manager */}
        <Route
          path="/staffs"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <StaffList />
            </ProtectedRoute>
          }
        />

        {/* --- SERVICE CATALOG --- */}
        {/* View Services: Ai đăng nhập cũng xem được */}
        <Route
          path="/services"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <ServiceList />
            </ProtectedRoute>
          }
        />

        {/* Xem chi tiết dịch vụ (Chỉ đọc) - dành cho tất cả role */}
        <Route
          path="/services/detail/:id"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <ServiceForm isReadOnly={true} />
            </ProtectedRoute>
          }
        />

        {/* Create Service: Chỉ Manager */}
        <Route
          path="/services/new"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <ServiceForm />
            </ProtectedRoute>
          }
        />

        {/* Update Service: Chỉ Manager */}
        <Route
          path="/services/edit/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <ServiceForm />
            </ProtectedRoute>
          }
        />

        {/* --- FEEDBACK & REVIEW --- */}
        {/* View Other Feedback: Customer, Receptionist, Manager (Technician KHÔNG xem) */}
        <Route
          path="/feedback"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Manager"]}
            >
              <PublicFeedbackList />
            </ProtectedRoute>
          }
        />

        {/* Các thao tác cá nhân (Create/Update/Delete Feedback): Chỉ Customer */}
        <Route
          path="/my-feedback"
          element={
            <ProtectedRoute user={user} allowedRoles={["Customer"]}>
              <MyFeedbackList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/new"
          element={
            <ProtectedRoute user={user} allowedRoles={["Customer"]}>
              <FeedbackForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback/edit/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={["Customer"]}>
              <FeedbackForm />
            </ProtectedRoute>
          }
        />

        {/* --- INVENTORY MANAGEMENT (QUẢN LÝ KHO) --- */}
        <Route
          path="/manager/products"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/suppliers"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <SupplierList />
            </ProtectedRoute>
          }
        />

        {/* --- APPOINTMENT: Customer, Receptionist, Technician, Manager --- */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <AppointmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:id"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <AppointmentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:id/reschedule"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <RescheduleAppointment />
            </ProtectedRoute>
          }
        />

        {/* --- TREATMENT PACKAGE MANAGEMENT --- */}
        {/* Manager: CRUD gói liệu trình */}
        <Route
          path="/manager/treatment-packages"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <TreatmentPackageList />
            </ProtectedRoute>
          }
        />
        {/* Tất cả role: Xem danh sách gói liệu trình (cho Customer chọn mua) */}
        <Route
          path="/treatment-packages"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <TreatmentPackageList />
            </ProtectedRoute>
          }
        />

        {/* --- 5 CHỨC NĂNG MỚI --- */}

        {/* 1. View Treatment Status - Tất cả role */}
        <Route
          path="/treatment-status"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Customer", "Receptionist", "Technician", "Manager"]}
            >
              <TreatmentStatus />
            </ProtectedRoute>
          }
        />

        {/* 2. Update Service Status - Chỉ Manager */}
        <Route
          path="/manager/update-service-status"
          element={
            <ProtectedRoute user={user} allowedRoles={["Manager"]}>
              <UpdateServiceStatus />
            </ProtectedRoute>
          }
        />

        {/* 3. Update Room & Bed Status - Manager, Receptionist, Technician */}
        <Route
          path="/update-room-bed-status"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Manager", "Receptionist", "Technician"]}
            >
              <UpdateRoomBedStatus />
            </ProtectedRoute>
          }
        />

        {/* 4. Record Treatment Outcomes - Manager, Technician */}
        <Route
          path="/record-treatment-outcome"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Manager", "Technician"]}
            >
              <RecordTreatmentOutcome />
            </ProtectedRoute>
          }
        />

        {/* 5. Sell Treatment Package - Manager, Receptionist */}
        <Route
          path="/sell-treatment-package"
          element={
            <ProtectedRoute
              user={user}
              allowedRoles={["Manager", "Receptionist"]}
            >
              <SellTreatmentPackage />
            </ProtectedRoute>
          }
        />

      </Route>
    </Routes>
  );
}
