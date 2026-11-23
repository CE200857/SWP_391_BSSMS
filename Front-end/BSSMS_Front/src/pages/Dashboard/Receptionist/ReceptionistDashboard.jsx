import ReceptionistBookingDesk from "./ReceptionistBookingDesk";

// Receptionist home = overview + check-in & coordination in one page
export default function ReceptionistDashboard({ user }) {
  return <ReceptionistBookingDesk user={user || { role: "Receptionist" }} />;
}
