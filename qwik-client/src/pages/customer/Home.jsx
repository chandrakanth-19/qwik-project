import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Search, SlidersHorizontal } from "lucide-react";
import { menuAPI, canteenAPI } from "../../api";
import { FoodCard, Spinner } from "../../components";
import useCartStore from "../../store/cartStore";

export default function Home() {
  const navigate    = useNavigate();
  const addItem     = useCartStore((s) => s.addItem);
  const [canteen, setCanteen] = useState(null);
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [category, setCategory] = useState("");

  const canteenId = sessionStorage.getItem("selected_canteen");

  useEffect(() => {
    if (!canteenId) { navigate("/halls"); return; }
    Promise.all([
      canteenAPI.getOne(canteenId),
      menuAPI.getMenu(canteenId),
    ]).then(([c, m]) => {
      setCanteen(c.data.data);
      setItems(m.data.data);
      setLoading(false);
    });
  }, [canteenId]);

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchVeg    = vegOnly ? i.is_veg : true;
    const matchCat    = category ? i.category === category : true;
    return matchSearch && matchVeg && matchCat;
  });

  const categories = [...new Set(items.map((i) => i.category))];

  const handleAdd = (item) => {
    addItem({ item_id: item._id, name: item.name, price: item.price, canteen_id: canteenId });
    toast.success(`${item.name} added to cart`);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{canteen?.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${canteen?.is_open ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-sm text-gray-500">{canteen?.is_open ? "Open" : "Closed"} · {canteen?.hall}</span>
          </div>
        </div>
        <button onClick={() => navigate("/halls")} className="text-sm text-brand-600 hover:underline">
          Change canteen
        </button>
      </div>

      {/* Search + filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search dishes..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setVegOnly((v) => !v)}
          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${vegOnly ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          🌿 Veg only
        </button>
      </div>

      {/* Menu grid */}
      {filtered.length === 0
        ? <p className="text-center text-gray-400 py-12">No items found</p>
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((item) => <FoodCard key={item._id} item={item} onAdd={handleAdd} />)}
          </div>
      }
    </div>
  );
}
