import api from "./axios";

// ── AUTH ─────────────────────────────────────────────────────
export const authAPI = {
  register:       (d) => api.post("/auth/register", d),
  verifyOTP:      (d) => api.post("/auth/verify-otp", d),
  login:          (d) => api.post("/auth/login", d),
  adminLogin:     (d) => api.post("/auth/admin-login", d),
  adminRegister:  (d) => api.post("/auth/admin-register", d),
  forgotPassword: (d) => api.post("/auth/forgot-password", d),
  resetPassword:  (d) => api.post("/auth/reset-password", d),
  logout:         ()  => api.post("/auth/logout"),
};

// ── USER ─────────────────────────────────────────────────────
export const userAPI = {
  getMe:       ()  => api.get("/users/me"),
  updateMe:    (d) => api.put("/users/me", d),
  uploadPhoto: (f) => api.post("/users/me/photo", f, { headers: { "Content-Type": "multipart/form-data" } }),
};

// ── CANTEEN ──────────────────────────────────────────────────
export const canteenAPI = {
  getAll:       ()      => api.get("/canteens"),
  getOne:       (id)    => api.get(`/canteens/${id}`),
  getMine:      ()      => api.get("/canteens/mine"),
  update:       (id, d) => api.put(`/canteens/${id}`, d),
  updateStatus: (id, d) => api.put(`/canteens/${id}/status`, d),
};

// ── MENU ─────────────────────────────────────────────────────
export const menuAPI = {
  getMenu:            (canteenId, params) => api.get(`/menu/canteen/${canteenId}`, { params }),
  addItem:            (canteenId, d)      => api.post(`/menu/canteen/${canteenId}`, d),
  updateItem:         (itemId, d)         => api.put(`/menu/${itemId}`, d),
  deleteItem:         (itemId)            => api.delete(`/menu/${itemId}`),
  toggleAvailability: (itemId, d)         => api.put(`/menu/${itemId}/availability`, d),
  uploadPhoto:        (itemId, f)         => api.post(`/menu/${itemId}/photo`, f, { headers: { "Content-Type": "multipart/form-data" } }),
};

// ── ORDERS ───────────────────────────────────────────────────
export const orderAPI = {
  place:              (d)          => api.post("/orders", d),
  getOne:             (id)         => api.get(`/orders/${id}`),
  myOrders:           ()           => api.get("/orders/me"),
  cancel:             (id)         => api.put(`/orders/${id}/cancel`),
  reconfirm:          (id)         => api.put(`/orders/${id}/reconfirm`),
  getCanteenOrders:   (cid, params)=> api.get(`/orders/canteen/${cid}`, { params }),
  updateStatus:       (id, d)      => api.put(`/orders/${id}/status`, d),
  submitReview:       (id, d)      => api.post(`/orders/${id}/review`, d),
};

// ── RESERVATIONS ─────────────────────────────────────────────
export const reservationAPI = {
  create:                 (d)    => api.post("/reservations", d),
  mine:                   ()     => api.get("/reservations/me"),
  cancel:                 (id)   => api.put(`/reservations/${id}/cancel`),
  getCanteenReservations: (cid)  => api.get(`/reservations/canteen/${cid}`),
  updateStatus:           (id,d) => api.put(`/reservations/${id}/status`, d),
};

// ── PAYMENTS ─────────────────────────────────────────────────
export const paymentAPI = {
  initiate: (orderId) => api.post(`/payments/initiate/${orderId}`),
  verify:   (d)       => api.post("/payments/verify", d),
};

// ── ADMIN ────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:        ()      => api.get("/admin/dashboard"),
  getPendingMerchants: ()      => api.get("/admin/merchants/pending"),
  approveMerchant:     (id, d) => api.put(`/admin/merchants/${id}/approve`, d),
  rejectMerchant:      (id)    => api.put(`/admin/merchants/${id}/reject`),
  getUsers:            ()      => api.get("/admin/users"),
  toggleBlock:         (id)    => api.put(`/admin/users/${id}/block`),
  getCanteens:         ()      => api.get("/admin/canteens"),
  addCanteen:          (d)     => api.post("/admin/canteens", d),
  updateCanteen:       (id, d) => api.put(`/admin/canteens/${id}`, d),
  deleteCanteen:       (id)    => api.delete(`/admin/canteens/${id}`),
  getApprovedMerchants: ()     => api.get("/admin/merchants/approved"),  // ADD THIS
  getApprovedMerchants:  ()          => api.get("/admin/merchants/approved"),
toggleBlockMerchant:   (id)        => api.put(`/admin/merchants/${id}/block`),
removeMerchant:        (id)        => api.delete(`/admin/merchants/${id}`),
updateMerchant:        (id, d)     => api.put(`/admin/merchants/${id}`, d),
addMerchant:           (d)         => api.post("/admin/merchants", d),
reassignCanteen:       (cid, d)    => api.put(`/admin/canteens/${cid}/reassign`, d),
};
