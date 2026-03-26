import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListOrdered, UtensilsCrossed, PartyPopper, Settings, BarChart2, LogOut, Clock, CalendarClock, UserCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/merchant/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/merchant/orders",        icon: ListOrdered,     label: "Incoming Orders" },
  { to: "/merchant/order-history", icon: Clock,           label: "Order History" },
  { to: "/merchant/menu",          icon: UtensilsCrossed, label: "Menu Manager" },
  { to: "/merchant/party",         icon: PartyPopper,     label: "Party Requests" },
  { to: "/merchant/party-history", icon: CalendarClock,   label: "Party History" },
  { to: "/merchant/settings",      icon: Settings,        label: "Canteen Settings" },
  { to: "/merchant/analytics",     icon: BarChart2,       label: "Analytics" },
  // FIX 2: Merchant profile link
  { to: "/merchant/profile",       icon: UserCircle,      label: "My Profile" },
];

export default function MerchantSidebar({ collapsed }) {
  const { logout } = useAuth();

  return (
    <nav className="flex flex-col h-full py-4">
      <div className={`flex items-center gap-2 px-4 mb-6 ${collapsed ? "justify-center" : ""}`}>
        <img src="/logo.png" alt="Logo" className="h-6 w-auto flex-shrink-0" />
        {!collapsed && <span className="font-bold text-lg text-purple-700">Qwik Merchant</span>}
      </div>

      <div className="flex-1 space-y-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-100"} ${collapsed ? "justify-center" : ""}`
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
