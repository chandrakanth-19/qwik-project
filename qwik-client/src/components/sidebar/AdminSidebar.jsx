import { NavLink } from "react-router-dom";
import { LayoutDashboard, UserCheck, Users, Store, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/admin/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/approvals",   icon: UserCheck,       label: "Merchant Approvals" },
  { to: "/admin/users",       icon: Users,           label: "User Management" },
  { to: "/admin/canteens",    icon: Store,           label: "Canteen Management" },
  { to: "/admin/settings",    icon: Settings,        label: "System Settings" },
  { to: "/admin/merchants", icon: Store, label: "Manage Merchants" },
];

export default function AdminSidebar({ collapsed }) {
  const { logout } = useAuth();

  return (
    <nav className="flex flex-col h-full py-4">
      <div className={`flex items-center gap-2 px-4 mb-6 ${collapsed ? "justify-center" : ""}`}>
        <img src="/logo.png" alt="Logo" className="h-6 w-auto flex-shrink-0" />
        {!collapsed && <span className="font-bold text-lg text-amber-700">Super Admin</span>}
      </div>

      <div className="flex-1 space-y-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:bg-gray-100"} ${collapsed ? "justify-center" : ""}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="px-2 pt-2 border-t border-gray-100">
        <button
          onClick={logout}
          className={`sidebar-link w-full text-red-500 hover:bg-red-50 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  );
}
