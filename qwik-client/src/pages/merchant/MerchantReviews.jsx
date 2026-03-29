import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { menuAPI, canteenAPI } from "../../api";
import { Spinner } from "../../components";

// Renders 1–5 filled/empty stars
function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
        />
      ))}
    </div>
  );
}

export default function MerchantReviews() {
  const [canteenId, setCanteenId] = useState(null);
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("ALL"); // ALL | 1..5

  useEffect(() => {
    canteenAPI.getMine()
      .then(({ data }) => {
        const c = Array.isArray(data.data) ? data.data[0] : data.data;
        setCanteenId(c._id);
        return menuAPI.getCanteenReviews(c._id);
      })
      .then(({ data }) => setReviews(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const filtered = filter === "ALL"
    ? reviews
    : reviews.filter((r) => r.rating === Number(filter));

  // Average rating
  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Count per star
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">Customer Reviews</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Star size={40} className="mx-auto mb-3 opacity-30" />
          <p>No reviews yet. They'll appear here once customers rate their orders.</p>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="card p-5 mb-6 flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{avg}</p>
              <StarDisplay rating={Math.round(Number(avg))} />
              <p className="text-xs text-gray-400 mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 space-y-1">
              {starCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-500 text-right">{star}</span>
                  <Star size={11} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-5 text-gray-400 text-xs">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter by star */}
          <div className="flex gap-2 flex-wrap mb-4">
            {["ALL", "5", "4", "3", "2", "1"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  filter === f
                    ? "bg-gray-800 text-white border-gray-800"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {f === "ALL" ? "All" : `${f} ★`}
              </button>
            ))}
          </div>

          {/* Review list */}
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No reviews for this rating.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-medium text-sm">{r.item_id?.name || "Item"}</p>
                      <p className="text-xs text-gray-400">{r.user_id?.name || "Customer"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarDisplay rating={r.rating} />
                      <span className="text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2 italic">
                      "{r.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
