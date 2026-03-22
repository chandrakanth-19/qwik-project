# Qwik — IITK Digital Canteen System

Full-stack food ordering platform for IITK campus canteens.

## Project Structure

```
qwik/
├── qwik-server/   ← Node.js + Express + MongoDB backend
└── qwik-client/   ← React + Vite + TailwindCSS frontend
```

## Quick Start

### 1. Backend Setup

```bash
cd qwik-server
npm install

# Copy env file and fill in your values
cp .env.example .env

# Required values in .env:
# MONGO_URI       — MongoDB connection string
# JWT_SECRET      — any random long string
# EMAIL_USER/PASS — Gmail with App Password enabled
# RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET — from RazorPay dashboard
# ADMIN_INVITE_CODE — secret code for super admin registration

npm run dev   # starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd qwik-client
npm install
npm run dev   # starts on http://localhost:5173
```

---

## User Flows

### Customer
1. Register at `/register` with IITK email (or phone for visitors)
2. Verify OTP → redirected to login
3. Login → select canteen → browse menu → add to cart
4. Checkout → wait for merchant to accept → pay → track order
5. Rate items after order is COMPLETED

### Merchant
1. Register at `/register` with role = Merchant
2. Wait for Super Admin approval
3. Login at `/login` → merchant dashboard
4. Accept/reject incoming orders, manage menu, handle party requests

### Super Admin
1. Register at `/admin/register` with invite code (`ADMIN_INVITE_CODE` from .env)
2. Login at `/admin/login`
3. Approve merchants, manage users and canteens

---

## Key Design Decisions

| Decision | Choice |
|---|---|
| Order partial reject | Merchant marks items unavailable → user reconfirms |
| Notifications | Polling every 4 seconds (free, no infra needed) |
| Cart persistence | Session only (clears on browser close) |
| Ratings | Only after order status = COMPLETED |
| Cake pre-order lead time | Minimum 4 hours |
| Student registration | @iitk.ac.in email only |
| Visitor registration | Phone number + SMS OTP |
| Admin auth | Separate `/admin/login` + invite code registration |
| Payment gateway | RazorPay (UPI + Card + Netbanking) |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register (email or phone) |
| POST | /api/auth/verify-otp | Verify registration OTP |
| POST | /api/auth/login | Customer/Merchant login |
| POST | /api/auth/admin-login | Super Admin login |
| POST | /api/auth/admin-register | Admin registration (invite code) |
| GET | /api/canteens | List all canteens |
| GET | /api/menu/canteen/:id | Get menu (supports ?search=&category=&is_veg=) |
| POST | /api/orders | Place order |
| GET | /api/orders/:id | Get order (used for polling) |
| PUT | /api/orders/:id/cancel | Cancel pending order |
| PUT | /api/orders/:id/reconfirm | Reconfirm after partial accept |
| PUT | /api/orders/:id/status | Merchant updates status |
| POST | /api/payments/initiate/:orderId | Create RazorPay order |
| POST | /api/payments/verify | Verify payment signature |
| POST | /api/reservations | Create table/cake reservation |
| GET | /api/admin/dashboard | System stats |

---

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/qwik
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
ADMIN_INVITE_CODE=QWIK_SUPER_2026
CLIENT_URL=http://localhost:5173
```

---

## Tech Stack

**Backend:** Node.js · Express · MongoDB (Mongoose) · JWT · bcrypt · Nodemailer · RazorPay

**Frontend:** React 18 · Vite · TailwindCSS · Zustand · Axios · React Router v6 · React Hot Toast · Lucide Icons
