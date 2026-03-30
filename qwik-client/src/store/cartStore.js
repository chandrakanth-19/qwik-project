import { create } from "zustand";

const useCartStore = create((set, get) => ({
  items: [],      // [{ item_id, name, price, qty, canteen_id }]
  canteen_id: null,

  // When non-null, holds the item the user tried to add from a different canteen.
  // The UI should show a confirmation dialog and call either
  //   confirmSwitchCanteen()  — to clear cart and add the pending item
  //   cancelSwitchCanteen()   — to dismiss and keep the existing cart
  pendingSwitchItem: null,

  addItem: (item) => {
    const { items, canteen_id } = get();

    // Different canteen → don't add yet, store pending item so UI can warn
    if (canteen_id && canteen_id !== item.canteen_id) {
      set({ pendingSwitchItem: item });
      return;
    }

    const existing = items.find((i) => i.item_id === item.item_id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.item_id === item.item_id ? { ...i, qty: i.qty + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, qty: 1 }], canteen_id: item.canteen_id });
    }
  },

  // Called when the user confirms they want to switch canteens
  confirmSwitchCanteen: () => {
    const { pendingSwitchItem } = get();
    if (!pendingSwitchItem) return;
    set({
      items: [{ ...pendingSwitchItem, qty: 1 }],
      canteen_id: pendingSwitchItem.canteen_id,
      pendingSwitchItem: null,
    });
  },

  // Called when the user cancels the switch
  cancelSwitchCanteen: () => set({ pendingSwitchItem: null }),

  removeItem: (item_id) =>
    set((s) => ({ items: s.items.filter((i) => i.item_id !== item_id) })),

  updateQty: (item_id, qty) => {
    if (qty <= 0) { get().removeItem(item_id); return; }
    set((s) => ({
      items: s.items.map((i) => i.item_id === item_id ? { ...i, qty } : i),
    }));
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
