import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { STATUS_COLORS } from "../utils/constants";
import { Star } from "lucide-react";
import useCartStore from "../store/cartStore";

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  const sz = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6";
  return (
    <div className={`${sz} animate-spin rounded-full border-2 border-brand-400 border-t-transparent`} />
  );
}

// ── ProtectedRoute ───────────────────────────────────────────
export function ProtectedRoute({ children, roles }) {
  const { token, role } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/login" replace />;
  return children;
}

// ── AdminProtectedRoute ──────────────────────────────────────
export function AdminProtectedRoute({ children }) {
  const { token, role } = useAuthStore();
  if (!token || role !== "admin") return <Navigate to="/admin/login" replace />;
  return children;
}

// ── OrderStatusBadge ─────────────────────────────────────────
export function OrderStatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ── StarRating ───────────────────────────────────────────────
export function StarRating({ value = 0, onChange, size = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          onClick={() => onChange?.(n)}
          className={`${n <= value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} ${onChange ? "cursor-pointer hover:text-yellow-400" : ""}`}
        />
      ))}
    </div>
  );
}

// ── FoodCard ─────────────────────────────────────────────────
export function FoodCard({ item, onAdd }) {
  const cartItems = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const cartItem  = cartItems.find((i) => i.item_id === item._id);
  const qty       = cartItem?.qty || 0;

  return (
    <div className="card p-4 flex gap-4">
      {item.photo_url && (
        <img src={item.photo_url} alt={item.name}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`w-3 h-3 rounded-sm border-2 flex-shrink-0
                ${item.is_veg ? "border-green-600" : "border-red-600"}`}>
                <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5
                  ${item.is_veg ? "bg-green-600" : "bg-red-600"}`} />
              </span>
              <h3 className="font-medium text-sm">{item.name}</h3>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <StarRating value={Math.round(item.avg_rating)} size={12} />
              <span className="text-xs text-gray-400">({item.rating_count})</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-sm">₹{item.price}</p>
            <p className="text-xs text-gray-400">{item.prep_time_mins} min</p>
          </div>
        </div>

        {/* Add button / counter */}
        <div className="mt-2">
          {!item.is_available ? (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
              Unavailable
            </span>
          ) : qty === 0 ? (
            <button onClick={() => onAdd(item)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-400 text-white hover:bg-brand-600 transition-colors">
              Add
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item._id, qty - 1)}
                className="w-7 h-7 rounded-full border border-brand-400 text-brand-600 flex items-center justify-center hover:bg-brand-50 font-bold text-lg">
                −
              </button>
              <span className="text-sm font-bold text-brand-600 w-4 text-center">
                {qty}
              </span>
              <button
                onClick={() => onAdd(item)}
                className="w-7 h-7 rounded-full border border-brand-400 text-brand-600 flex items-center justify-center hover:bg-brand-50 font-bold text-lg">
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}