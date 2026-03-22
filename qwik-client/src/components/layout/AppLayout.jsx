import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import useAuthStore from "../../store/authStore";
import CustomerSidebar from "../sidebar/CustomerSidebar";
import MerchantSidebar from "../sidebar/MerchantSidebar";
import AdminSidebar    from "../sidebar/AdminSidebar";

const SIDEBAR_KEY = "qwik_sidebar_open";

const SIDEBAR_MAP = {
  customer: CustomerSidebar,
  merchant: MerchantSidebar,
  admin:    AdminSidebar,
};

const SIDEBAR_WIDTHS = {
  open:      "w-60",
  collapsed: "w-16",
};

export default function AppLayout({ children }) {
  const { role, user } = useAuthStore();
  const [open, setOpen]         = useState(() => localStorage.getItem(SIDEBAR_KEY) !== "false");
  const [mobileOpen, setMobile] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, open);
  }, [open]);

  const SidebarComponent = SIDEBAR_MAP[role] || CustomerSidebar;
  const collapsed = !open;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-100 flex-shrink-0 transition-all duration-200 ${collapsed ? SIDEBAR_WIDTHS.collapsed : SIDEBAR_WIDTHS.open}`}
      >
        <SidebarComponent collapsed={collapsed} />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-100 w-60 transform transition-transform duration-200 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SidebarComponent collapsed={false} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {/* Desktop hamburger — collapse/expand */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={18} className="text-gray-600" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobile((o) => !o)}
            className="flex md:hidden items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <span className="text-sm font-medium text-gray-500 capitalize">{role} portal</span>
          <div className="ml-auto flex items-center gap-2">
            {user?.profile_photo
              ? <img src={user.profile_photo} className="w-8 h-8 rounded-full object-cover" alt="" />
              : <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
            }
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
