import OperationsWorkspace from "../pages/Dashboard/Manager/OperationsWorkspace";
import ManagerFeedbackWorkspace from "../pages/Dashboard/Manager/ManagerFeedbackWorkspace";
import { useLayoutEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import RouteErrorBoundary from "../components/RouteErrorBoundary";
import { roleHome } from "../auth/login";
import Footer from "../components/Footer";
import Sidebar from "../components/Sidebar";

import GuestHome from "../pages/Homepages/Guest/GuestHome";
import DashboardLogin from "../pages/Auth/DashboardLogin";
import Login from "../pages/Auth/Login";
import Profile from "../pages/Auth/Profile";
import Register from "../pages/Auth/Register";
import ChangePassword from "../pages/Auth/ChangePassword";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import ResetPassword from "../pages/Auth/ResetPassword";
import FaqPage from "../pages/Shared/Info/FaqPage";
import PrivacyPolicy from "../pages/Shared/Info/PrivacyPolicy";
import TermsOfUse from "../pages/Shared/Info/TermsOfUse";
import EditProfile from "../pages/Auth/EditProfile";

import CustomerHome from "../pages/Homepages/Customer/CustomerHome";
import ManagerDashboard from "../pages/Dashboard/Manager/ManagerDashboard";
import ReceptionistDashboard from "../pages/Dashboard/Receptionist/ReceptionistDashboard";
import CreateWalkInCustomer from "../pages/Dashboard/Receptionist/CreateWalkInCustomer.jsx";
import TechnicianDashboard from "../pages/Dashboard/Technician/TechnicianDashboard";

import CustomerList from "../pages/Dashboard/Manager/CustomerAdmin/CustomerList";
import EditCustomerProfile from "../pages/Dashboard/Manager/CustomerAdmin/EditCustomerProfile";
import StaffList from "../pages/Dashboard/Manager/StaffAdmin/StaffList";
import ServiceList from "../pages/Shared/ServiceList/ServiceList";
import ServiceForm from "../pages/Shared/ServiceList/ServiceForm";
import PublicTreatmentPackages from "../pages/Shared/ServiceList/PublicTreatmentPackages";
import MyFeedbackList from "../pages/Shared/Feedback/MyFeedbackList";
import PublicFeedbackList from "../pages/Shared/Feedback/PublicFeedbackList";
import FeedbackForm from "../pages/Shared/Feedback/FeedbackForm";

import CreateWalkInAppointment from "../pages/Dashboard/Appointment/CreateWalkInAppointment";
import AppointmentList from "../pages/Dashboard/Appointment/AppointmentList";
import AppointmentDetails from "../pages/Dashboard/Appointment/AppointmentDetails";
import RescheduleAppointment from "../pages/Dashboard/Appointment/RescheduleAppointment";
import TreatmentPackageList from "../pages/Dashboard/Manager/TreatmentPackageAdmin/TreatmentPackageList";
import ResourceManagement from "../pages/Dashboard/Manager/ResourceAdmin/ResourceManagement";
import CreateStaff from "../pages/Dashboard/Manager/StaffAdmin/CreateStaff";
import StaffDetail from "../pages/Dashboard/Manager/StaffAdmin/StaffDetail";
import EditStaffProfile from "../pages/Dashboard/Manager/StaffAdmin/EditStaffProfile";
import CreateInvoice from "../pages/Dashboard/Receptionist/CreateInvoice";
import InvoiceManagement from "../pages/Dashboard/Manager/InvoiceManagement";

import ServiceHistory from "../pages/Dashboard/ServiceHistory/ServiceHistory";
import MembershipBenefits from "../pages/Shared/Membership/MembershipBenefits";
import MembershipManagementPage from "../pages/Dashboard/Manager/MembershipAdmin/MembershipManagementPage";

import UpdateRoomBedStatus from "../pages/Dashboard/Technician/UpdateRoomBedStatus";
import RecordTreatmentOutcome from "../pages/Dashboard/Technician/RecordTreatmentOutcome";
import TreatmentStatus from "../pages/Dashboard/Technician/TreatmentStatus";
import SellTreatmentPackage from "../pages/Dashboard/Receptionist/SellTreatmentPackage";

import CheckSlotAvailability from "../pages/Dashboard/Appointment/CheckSlotAvailability";
import CreateOnlineAppointment from "../pages/Dashboard/Appointment/CreateOnlineAppointment";
import ReceptionistBookingDesk from "../pages/Dashboard/Receptionist/ReceptionistBookingDesk";

import VoucherList from "../pages/Dashboard/Manager/VoucherManagement/VoucherList";
import CustomerTreatmentProfile from "../pages/Dashboard/Manager/CustomerTreatmentProfile/CustomerTreatmentProfile";

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        to={allowedRoles.includes("Customer") ? "/login" : "/dashboard/login"}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );

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

const LegacySlotsRedirect = () => {
  const location = useLocation();
  return (
    <Navigate to={"/slots" + location.search} state={location.state} replace />
  );
};

const GuestLayout = ({ user, setUser }) => {
  const location = useLocation();
  return (
    <div className="app-guest-layout">
      <Header user={user} setUser={setUser} />
      <main className="app-guest-main">
        <div className="app-route-content">
          <RouteErrorBoundary key={location.pathname} home={user ? roleHome(user.role) : "/bssms-guest"}><Outlet /></RouteErrorBoundary>
        </div>
      </main>
      <Footer user={user} />
    </div>
  );
};

const DashboardLayout = ({ user, setUser }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => globalThis.sessionStorage?.getItem("sidebarCollapsed") === "true",
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const location = useLocation();

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [location.pathname]);
  if (!user) return <Outlet />;

  if (user.role === "Customer") {
    return (
      <div className="app-guest-layout app-customer-layout">
        <Header user={user} setUser={setUser} />
        <main className="app-guest-main app-customer-main">
          <div className="app-route-content">
            <RouteErrorBoundary key={location.pathname} home={roleHome(user.role)}><Outlet /></RouteErrorBoundary>
          </div>
        </main>
        <Footer user={user} />
      </div>
    );
  }

  return (
    <div
      className={`app-dashboard d-flex m-0 p-0${mobileMenuOpen ? " mobile-nav-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") setMobileMenuOpen(false);
      }}
      style={{ overflowX: "hidden" }}
    >
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onNavigate={() => setMobileMenuOpen(false)}
        onToggle={() => {
          if (window.matchMedia("(max-width: 767px)").matches) {
            setMobileMenuOpen(false);
            return;
          }
          setSidebarCollapsed((prev) => {
            sessionStorage.setItem("sidebarCollapsed", String(!prev));
            return !prev;
          });
        }}
      />
      {mobileMenuOpen && (
        <button
          className="dashboard-menu-backdrop"
          aria-label="Đóng menu chức năng"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="app-dashboard-shell">
        <Header
          user={user}
          dashboard
          onMenuToggle={() => setMobileMenuOpen((open) => !open)}
          mobileMenuOpen={mobileMenuOpen}
        />
        <main
          ref={scrollRef}
          className="app-dashboard-content flex-grow-1"
          id="main-content"
        >
          <div className="app-route-content">
            <RouteErrorBoundary key={location.pathname} home={roleHome(user.role)}><Outlet /></RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

const ALL_STAFF = ["Manager", "Receptionist", "Technician"];
const EVERYONE = ["Customer", ...ALL_STAFF];

export default function AppRoutes({ user, setUser }) {
  const guard = (roles, element) => (
    <ProtectedRoute user={user} allowedRoles={roles}>{element}</ProtectedRoute>
  );
  return (
    <Routes>
      <Route path="/dashboard/login" element={<DashboardLogin user={user} setUser={setUser} />} />

      <Route element={<GuestLayout user={user} setUser={setUser} />}>
        <Route path="/bssms-guest" element={<GuestHome user={user} />} />
        <Route path="/" element={<Navigate to="/bssms-guest" replace />} />
        <Route path="/login" element={<Login user={user} setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/update-profile" element={<Navigate to="/login" replace />} />
        <Route path="/guest/services" element={<ServiceList user={user} />} />
        <Route path="/guest/services/:id" element={<ServiceForm isReadOnly={true} />} />
        <Route path="/guest/treatment-packages" element={<PublicTreatmentPackages />} />
        <Route path="/guest/feedback" element={<PublicFeedbackList />} />
        <Route path="/guest/slots" element={<LegacySlotsRedirect />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfUse />} />
      </Route>

      <Route element={<DashboardLayout user={user} setUser={setUser} />}>
        <Route path="/profile" element={guard(EVERYONE, <Profile user={user} setUser={setUser} />)} />
        <Route path="/change-password" element={guard(EVERYONE, <ChangePassword />)} />
        <Route path="/edit-profile" element={guard(EVERYONE, <EditProfile user={user} setUser={setUser} />)} />

        <Route path="/customer/home" element={guard(["Customer"], <CustomerHome user={user} />)} />
        <Route path="/manager/dashboard" element={guard(["Manager"], <ManagerDashboard />)} />
        <Route path="/receptionist/dashboard" element={guard(["Receptionist"], <ReceptionistDashboard />)} />
        <Route path="/technician/dashboard" element={guard(["Technician"], <TechnicianDashboard />)} />

        <Route path="/receptionist/create-walkin" element={guard(["Receptionist"], <CreateWalkInCustomer />)} />
        <Route path="/customers" element={guard(["Receptionist", "Manager"], <CustomerList user={user} />)} />
        <Route path="/customers/edit/:id" element={guard(["Receptionist", "Manager"], <EditCustomerProfile user={user} />)} />
        <Route path="/my-treatment-profile" element={guard(EVERYONE, <CustomerTreatmentProfile />)} />
        <Route path="/treatment-profile/:customerId" element={guard(ALL_STAFF, <CustomerTreatmentProfile />)} />
        <Route path="/membership-benefits" element={guard(["Customer", "Receptionist", "Manager"],
          user?.role === "Manager" ? <MembershipManagementPage /> : <MembershipBenefits user={user} />)} />
        <Route path="/manager/membership-tiers" element={guard(["Manager"], <MembershipManagementPage />)} />

        <Route path="/staffs" element={guard(["Manager"], <StaffList user={user} />)} />
        <Route path="/staffs/detail/:id" element={guard(["Manager"], <StaffDetail />)} />
        <Route path="/manager/create-staff" element={guard(["Manager"], <CreateStaff />)} />
        <Route path="/staffs/edit/:id" element={guard(["Manager"], <EditStaffProfile user={user} />)} />
        <Route path="/manager/scheduling" element={guard(["Manager"], <OperationsWorkspace kind="scheduling" />)} />
        <Route path="/manager/leaves" element={guard(["Manager"], <OperationsWorkspace kind="leaves" />)} />
        <Route path="/manager/tour-report" element={guard(["Manager"], <OperationsWorkspace kind="tour-report" />)} />
        <Route path="/my-schedule" element={guard(["Technician", "Receptionist"], <OperationsWorkspace kind="my-schedule" />)} />

        <Route path="/services" element={guard(EVERYONE, <ServiceList user={user} />)} />
        <Route path="/services/detail/:id" element={guard(EVERYONE, <ServiceForm isReadOnly={true} />)} />
        <Route path="/services/new" element={guard(["Manager"], <ServiceForm />)} />
        <Route path="/services/edit/:id" element={guard(["Manager"], <ServiceForm />)} />
        <Route path="/manager/treatment-packages" element={guard(["Manager"], <TreatmentPackageList />)} />
        <Route path="/treatment-packages" element={guard(EVERYONE,
          user?.role === "Customer" ? <PublicTreatmentPackages user={user} /> : <TreatmentPackageList />)} />
        <Route path="/manager/resources" element={guard(["Manager"], <ResourceManagement user={user} />)} />
        <Route path="/update-room-bed-status" element={guard(ALL_STAFF,
          user?.role === "Manager" ? <ResourceManagement user={user} /> : <UpdateRoomBedStatus user={user} />)} />
        <Route path="/room-bed-board" element={guard(ALL_STAFF, <UpdateRoomBedStatus user={user} />)} />

        <Route path="/appointments" element={guard(EVERYONE, <AppointmentList user={user} setUser={setUser} />)} />
        <Route path="/appointments/create" element={guard(["Receptionist"], <CreateWalkInAppointment />)} />
        <Route path="/appointments/online" element={guard(["Customer"], <CreateOnlineAppointment />)} />
        <Route path="/appointments/:id" element={guard(EVERYONE, <AppointmentDetails user={user} />)} />
        <Route path="/appointments/:id/reschedule" element={guard(["Customer", "Receptionist"], <RescheduleAppointment />)} />
        <Route path="/slots" element={guard(["Customer", "Receptionist", "Manager"], <CheckSlotAvailability user={user} setUser={setUser} />)} />
        <Route path="/receptionist/coordination" element={guard(["Receptionist", "Manager"], <ReceptionistBookingDesk user={user} />)} />

        <Route path="/treatment-status" element={guard(ALL_STAFF, <TreatmentStatus />)} />
        <Route path="/record-treatment-outcome" element={guard(["Technician"], <RecordTreatmentOutcome />)} />
        <Route path="/service-history" element={guard(EVERYONE, <ServiceHistory user={user} />)} />

        <Route path="/invoices" element={guard(["Customer", "Receptionist", "Manager"], <InvoiceManagement user={user} />)} />
        <Route path="/manager/invoices" element={guard(["Manager"], <InvoiceManagement user={user} />)} />
        <Route path="/invoices/create" element={guard(["Receptionist"], <CreateInvoice />)} />
        <Route path="/sell-treatment-package" element={guard(["Receptionist"], <SellTreatmentPackage />)} />
        <Route path="/vouchers" element={guard(["Manager", "Receptionist"], <VoucherList />)} />

        <Route path="/feedback" element={guard(["Customer", "Receptionist", "Manager"],
          user?.role === "Manager"
            ? <ManagerFeedbackWorkspace user={user} />
            : <PublicFeedbackList user={user} managerCompact={user?.role === "Receptionist"} />)} />
        <Route path="/manager/feedback-moderation" element={guard(["Manager"], <ManagerFeedbackWorkspace user={user} />)} />
        <Route path="/my-feedback" element={guard(["Customer"], <MyFeedbackList />)} />
        <Route path="/feedback/new" element={guard(["Customer"], <FeedbackForm />)} />
        <Route path="/feedback/edit/:id" element={guard(["Customer"], <FeedbackForm />)} />

        <Route path="*" element={<Navigate to={user ? roleHome(user.role) : "/bssms-guest"} replace />} />
      </Route>
    </Routes>
  );
}
