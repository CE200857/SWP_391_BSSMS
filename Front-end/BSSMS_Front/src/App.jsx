import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import AppRoutes from "./routes/AppRoutes";
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
        return loggedInUser ? JSON.parse(loggedInUser) : null;
    });

    return (
        <BrowserRouter>
            {/* Truyền user và setUser sang AppRoutes để nó tự điều phối giao diện */}
            <AppRoutes user={user} setUser={setUser} />
        </BrowserRouter>
    );
}

export default App;