import { NavLink } from "react-router-dom";
import { Home, ShoppingCart, Clock, PartyPopper, CalendarClock, User, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import useCartStore from "../../store/cartStore";

const links = [
  { to: "/home",          icon: Home,          label: "Browse" },
  { to: "/cart",          icon: ShoppingCart,  label: "Cart" },
  { to: "/history",       icon: Clock,         label: "Order History" },
  { to: "/party-mode",    icon: PartyPopper,   label: "Party Mode" },
  { to: "/party-history", icon: CalendarClock, label: "Party History" },
  { to: "/profile",       icon: User,          label: "Profile" },
];

export default function CustomerSidebar({ collapsed }) {
  const { logout } = useAuth();
  const count = useCartStore((s) => s.items.reduce((t, i) => t + i.qty, 0));

  return (
    <nav className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 mb-6 ${collapsed ? "justify-center" : ""}`}>
        <img src="/logo.png" alt="Logo" className="h-6 w-auto flex-shrink-0" />
        {!collapsed && <span className="font-bold text-lg text-brand-600">Qwik</span>}
      </div>

      {/* Nav links */}
      <div className="flex-1 space-y-1 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center" : ""}`
            }
          >
            <div className="relative">
              <Icon size={18} className="flex-shrink-0" />
              {label === "Cart" && count > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-400 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Logout */}
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