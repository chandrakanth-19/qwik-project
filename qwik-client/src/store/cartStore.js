import { create } from "zustand";

const useCartStore = create((set, get) => ({
  items: [],      // [{ item_id, name, price, qty, canteen_id }]
  canteen_id: null,

  addItem: (item) => {
    const { items, canteen_id } = get();
    // If adding from a different canteen, clear cart first
    if (canteen_id && canteen_id !== item.canteen_id) {
      if (!window.confirm("Your cart has items from another canteen. Clear cart and add this item?")) return;
      set({ items: [], canteen_id: null });
    }
    const existing = items.find((i) => i.item_id === item.item_id);
    if (existing) {
      set({ items: items.map((i) => i.item_id === item.item_id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({ items: [...items, { ...item, qty: 1 }], canteen_id: item.canteen_id });
    }
  },

  removeItem: (item_id) =>
    set((s) => ({ items: s.items.filter((i) => i.item_id !== item_id) })),

  updateQty: (item_id, qty) => {
    if (qty <= 0) { get().removeItem(item_id); return; }
    set((s) => ({ items: s.items.map((i) => i.item_id === item_id ? { ...i, qty } : i) }));
  },

  clearCart: () => set({ items: [], canteen_id: null }),

  get total() {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },
  get count() {
    return get().items.reduce((sum, i) => sum + i.qty, 0);
  },
}));

export default useCartStore;
