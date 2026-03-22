// ─────────────────────────────────────────────────────────────
// HallSelection.jsx
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { canteenAPI } from "../../api";
import { Spinner } from "../../components";
import { Store } from "lucide-react";

export function HallSelection() {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    canteenAPI.getAll().then(({ data }) => {
      setCanteens(data.data);
      setLoading(false);
    });
  }, []);

  const select = (id) => {
    sessionStorage.setItem("selected_canteen", id);
    navigate("/home");
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Select a Canteen</h1>
      <p className="text-gray-500 text-sm mb-6">Choose where you'd like to order from</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {canteens.map((c) => (
          <button key={c._id} onClick={() => select(c._id)}
            className="card p-5 text-left hover:shadow-md hover:border-brand-400 transition-all border border-transparent">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <Store size={18} className="text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-gray-500">{c.hall || c.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${c.is_open ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-xs text-gray-500">{c.is_open ? "Open now" : "Closed"}</span>
              <span className="text-xs text-gray-400 ml-auto">{c.opening_time} – {c.closing_time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
