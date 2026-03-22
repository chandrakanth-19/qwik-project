import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { orderAPI } from "../../api";
import { Spinner, StarRating } from "../../components";

export default function ReviewPage() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const [order,     setOrder]    = useState(null);
  const [loading,   setLoading]  = useState(true);
  const [submitting,setSubmitting] = useState(false);
  // ratings = { [item_id]: { rating: 0, comment: "" } }
  const [ratings,   setRatings]  = useState({});

  useEffect(() => {
    orderAPI.getOne(orderId).then(({ data }) => {
      const o = data.data;
      if (o.is_rated) {
        toast("You've already rated this order");
        navigate("/history");
        return;
      }
      setOrder(o);
      // Initialize rating state for each item
      const initial = {};
      o.items.forEach((i) => {
        initial[i.item_id] = { rating: 0, comment: "" };
      });
      setRatings(initial);
      setLoading(false);
    });
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate — all items must have a rating
    const unrated = Object.values(ratings).some((r) => r.rating === 0);
    if (unrated) {
      toast.error("Please rate all items before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const ratingsArray = Object.entries(ratings).map(([item_id, r]) => ({
        item_id,
        rating:  r.rating,
        comment: r.comment,
      }));

      await orderAPI.submitReview(orderId, { ratings: ratingsArray });
      toast.success("Thanks for your review!");
      navigate("/history");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  );

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">Rate your order</h1>
      <p className="text-sm text-gray-400 mb-6">
        #{orderId.slice(-8).toUpperCase()} · {order?.canteen_id?.name}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {order?.items.map((item) => (
          <div key={item.item_id} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-400">{item.qty} × ₹{item.price}</p>
              </div>
              {/* Star rating per item */}
              <StarRating
                value={ratings[item.item_id]?.rating || 0}
                onChange={(val) =>
                  setRatings((prev) => ({
                    ...prev,
                    [item.item_id]: { ...prev[item.item_id], rating: val },
                  }))
                }
                size={24}
              />
            </div>
            {/* Optional comment per item */}
            <input
              className="input text-sm"
              placeholder={`Comment on ${item.name} (optional)`}
              value={ratings[item.item_id]?.comment || ""}
              onChange={(e) =>
                setRatings((prev) => ({
                  ...prev,
                  [item.item_id]: { ...prev[item.item_id], comment: e.target.value },
                }))
              }
            />
            {/* Show warning if not rated yet */}
            {ratings[item.item_id]?.rating === 0 && (
              <p className="text-xs text-orange-500 mt-1">Please select a star rating</p>
            )}
          </div>
        ))}

        {/* Overall summary */}
        <div className="card p-4 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Overall rating</p>
          <div className="flex items-center gap-2">
            <StarRating
              value={Math.round(
                Object.values(ratings).reduce((s, r) => s + r.rating, 0) /
                (Object.values(ratings).length || 1)
              )}
              size={20}
            />
            <span className="text-sm text-gray-500">
              {(
                Object.values(ratings).reduce((s, r) => s + r.rating, 0) /
                (Object.values(ratings).length || 1)
              ).toFixed(1)} / 5
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/history")}
          className="btn-secondary w-full"
        >
          Skip
        </button>
      </form>
    </div>
  );
}