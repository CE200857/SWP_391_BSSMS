import ManagerSidebar from "./ManagerSidebar";
import { staffNavigation } from "./staffNavigation";

export default function Sidebar({ user, collapsed, onToggle, onNavigate }) {
  if (!staffNavigation[user?.role]) return null;
  return (
    <ManagerSidebar
      role={user.role}
      collapsed={collapsed}
      onToggle={onToggle}
      onNavigate={onNavigate}
    />
  );
}
