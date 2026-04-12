import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AppLayout  from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";

// Admin pages (new)
import ManageMerchants from "./pages/admin/ManageMerchants";

// Customer pages
import ReviewPage      from "./pages/customer/ReviewPage";
import PartyHistory    from "./pages/customer/PartyHistory";

// Merchant pages
import MerchantOrderHistory from "./pages/merchant/OrderHistory";
import MerchantPartyHistory from "./pages/merchant/PartyHistory";
// FIX 3: Merchant customer management
import MerchantCustomers    from "./pages/merchant/MerchantCustomers";

// Guards
import { ProtectedRoute, AdminProtectedRoute } from "./components";

// Auth pages
import Login          from "./pages/auth/Login";
import Register       from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import { AdminLogin, AdminRegister, AdminForgotPassword, AdminChangePassword } from "./pages/auth/AdminAuth";

// Customer pages
import Home           from "./pages/customer/Home";
import { HallSelection } from "./pages/customer/HallSelection";
import { Cart, Checkout, OrderTracking, OrderHistory, Profile } from "./pages/customer/CustomerPages";
import PartyMode      from "./pages/customer/PartyMode";
import PaymentPage    from "./pages/customer/Payment";

// Merchant pages
import MerchantDashboard from "./pages/merchant/Dashboard";
import MerchantOrders    from "./pages/merchant/Orders";
import MenuManager       from "./pages/merchant/MenuManager";
import PartyRequests     from "./pages/merchant/PartyRequests";
import { CanteenSettings, Analytics } from "./pages/merchant/MerchantSettings";
import MerchantProfile   from "./pages/merchant/MerchantProfile";
import MerchantReviews   from "./pages/merchant/MerchantReviews";

// Admin pages
import AdminDashboard    from "./pages/admin/AdminDashboard";
import MerchantApprovals from "./pages/admin/MerchantApprovals";
import { UserManagement, CanteenManagement } from "./pages/admin/AdminPages";

// Route helpers
function CustomerRoute({ children }) {
  return (
    <ProtectedRoute roles={["customer"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function MerchantRoute({ children }) {
  return (
    <ProtectedRoute roles={["merchant"]}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function AdminRoute({ children }) {
  return (
    <AdminProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </AdminProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Public auth routes ────────────────────────────── */}
      <Route path="/login"           element={<Login />} />
      <Route path="/register"        element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ── Admin auth routes ─────────────────────────────── */}
      <Route path="/admin/login"           element={<AdminLogin />} />
      <Route path="/admin/register"        element={<AdminRegister />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />

      {/* ── Customer routes ───────────────────────────────── */}
      <Route path="/halls"          element={<CustomerRoute><HallSelection /></CustomerRoute>} />
      <Route path="/home"           element={<CustomerRoute><Home /></CustomerRoute>} />
      <Route path="/cart"           element={<CustomerRoute><Cart /></CustomerRoute>} />
      <Route path="/checkout"       element={<CustomerRoute><Checkout /></CustomerRoute>} />
      <Route path="/orders"         element={<CustomerRoute><OrderHistory /></CustomerRoute>} />
      <Route path="/history"        element={<CustomerRoute><OrderHistory /></CustomerRoute>} />
      <Route path="/review/:orderId" element={<CustomerRoute><ReviewPage /></CustomerRoute>} />
      <Route path="/track/:orderId" element={<CustomerRoute><TrackingWrapper /></CustomerRoute>} />
      <Route path="/pay/:orderId"   element={<CustomerRoute><PaymentPage /></CustomerRoute>} />
      <Route path="/party-mode"     element={<CustomerRoute><PartyMode /></CustomerRoute>} />
      <Route path="/profile"        element={<CustomerRoute><Profile /></CustomerRoute>} />
      <Route path="/party-history"  element={<CustomerRoute><PartyHistory /></CustomerRoute>} />

      {/* ── Merchant routes ───────────────────────────────── */}
      <Route path="/merchant/dashboard"     element={<MerchantRoute><MerchantDashboard /></MerchantRoute>} />
      <Route path="/merchant/orders"        element={<MerchantRoute><MerchantOrders /></MerchantRoute>} />
      <Route path="/merchant/order-history" element={<MerchantRoute><MerchantOrderHistory /></MerchantRoute>} />
      <Route path="/merchant/menu"          element={<MerchantRoute><MenuManager /></MerchantRoute>} />
      <Route path="/merchant/reviews"       element={<MerchantRoute><MerchantReviews /></MerchantRoute>} />
      {/* FIX 3: Merchant customer management */}
      <Route path="/merchant/customers"     element={<MerchantRoute><MerchantCustomers /></MerchantRoute>} />
      <Route path="/merchant/party"         element={<MerchantRoute><PartyRequests /></MerchantRoute>} />
      <Route path="/merchant/party-history" element={<MerchantRoute><MerchantPartyHistory /></MerchantRoute>} />
      <Route path="/merchant/settings"      element={<MerchantRoute><CanteenSettings /></MerchantRoute>} />
      <Route path="/merchant/analytics"     element={<MerchantRoute><Analytics /></MerchantRoute>} />
      <Route path="/merchant/profile"       element={<MerchantRoute><MerchantProfile /></MerchantRoute>} />

      {/* ── Admin routes ──────────────────────────────────── */}
      <Route path="/admin/dashboard"  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/approvals"  element={<AdminRoute><MerchantApprovals /></AdminRoute>} />
      <Route path="/admin/users"      element={<AdminRoute><UserManagement /></AdminRoute>} />
      <Route path="/admin/canteens"   element={<AdminRoute><CanteenManagement /></AdminRoute>} />
      <Route path="/admin/merchants"  element={<AdminRoute><ManageMerchants /></AdminRoute>} />
      {/* FIX 4: Admin in-session password change */}
      <Route path="/admin/change-password" element={<AdminRoute><AdminChangePassword /></AdminRoute>} />
      <Route path="/admin/settings"   element={<AdminRoute><div className="p-4 text-gray-400">System settings coming soon</div></AdminRoute>} />

      {/* ── Redirects ─────────────────────────────────────── */}
      <Route path="/"  element={<Navigate to="/login" replace />} />
      <Route path="*"  element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

import { useParams } from "react-router-dom";
function TrackingWrapper() {
  const { orderId } = useParams();
  return <OrderTracking orderId={orderId} />;
}
