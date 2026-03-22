import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle, XCircle } from "lucide-react";
import { adminAPI } from "../../api";
import { Spinner } from "../../components";

export default function MerchantApprovals() {
  const [merchants, setMerchants] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [canteenForm, setCanteenForm] = useState({
    canteen_name: "", hall: "", location: "", opening_time: "08:00", closing_time: "22:00", contact: "",
  });
  const [saving, setSaving] = useState(false);

  const load = () =>
    adminAPI.getPendingMerchants().then(({ data }) => { setMerchants(data.data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setSaving(true);
    try {
      await adminAPI.approveMerchant(id, canteenForm);
      toast.success("Merchant approved and canteen created!");
      setSelected(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject and remove this merchant?")) return;
    await adminAPI.rejectMerchant(id);
    toast.success("Merchant rejected");
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Merchant Approvals</h1>
      {merchants.length === 0
        ? <div className="text-center py-16 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-2 text-green-300" />
            <p>All caught up — no pending approvals</p>
          </div>
        : <div className="space-y-3">
            {merchants.map((m) => (
              <div key={m._id} className="card overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.email} · {m.phone || "—"}</p>
                    <p className="text-xs text-gray-400">Registered {new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelected(selected?._id === m._id ? null : m)}
                      className="flex items-center gap-1 bg-brand-400 hover:bg-brand-600 text-white text-sm px-3 py-1.5 rounded-lg">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={() => reject(m._id)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded-lg">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>

                {/* Canteen setup form when approving */}
                {selected?._id === m._id && (
                  <div className="border-t p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-3">Set up canteen details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Canteen Name</label>
                        <input className="input text-sm" placeholder="e.g. Hall 5 Canteen"
                          value={canteenForm.canteen_name}
                          onChange={(e) => setCanteenForm({ ...canteenForm, canteen_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hall</label>
                        <input className="input text-sm" placeholder="e.g. Hall 5"
                          value={canteenForm.hall}
                          onChange={(e) => setCanteenForm({ ...canteenForm, hall: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Opening Time</label>
                        <input className="input text-sm" type="time" value={canteenForm.opening_time}
                          onChange={(e) => setCanteenForm({ ...canteenForm, opening_time: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Closing Time</label>
                        <input className="input text-sm" type="time" value={canteenForm.closing_time}
                          onChange={(e) => setCanteenForm({ ...canteenForm, closing_time: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
                        <input className="input text-sm" placeholder="Phone number"
                          value={canteenForm.contact}
                          onChange={(e) => setCanteenForm({ ...canteenForm, contact: e.target.value })} />
                      </div>
                    </div>
                    <button onClick={() => approve(m._id)} disabled={saving}
                      className="btn-primary text-sm">
                      {saving ? "Approving..." : "Confirm Approval"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}
