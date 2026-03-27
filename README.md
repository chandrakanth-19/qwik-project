# Qwik — IITK Digital Canteen System

Full stack food ordering platform for IITK campus canteens.

---

## Project Structure

```
qwik/
├── qwik-server/   # Node.js + Express + MongoDB backend
└── qwik-client/   # React + Vite + TailwindCSS frontend
```

---

## Quick Start

### 1. Backend Setup

```bash
cd qwik-server
npm install

# Copy env file and configure values
cp .env.example .env

npm run dev   # runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd qwik-client
npm install
npm run dev   # runs on http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env` file in `qwik-server/` and add:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_SECRET_KEY
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=YOUR_EMAIL
EMAIL_PASS=YOUR_APP_PASSWORD

STRIPE_KEY_ID=YOUR_KEY_ID
STRIPE_KEY_SECRET=YOUR_KEY_SECRET

ADMIN_INVITE_CODE=YOUR_ADMIN_CODE
CLIENT_URL=http://localhost:5173
```

 **Never commit your `.env` file to GitHub.**

---

## User Flows

### Customer

1. Register using IITK email or phone
2. Verify OTP → Login
3. Browse canteens → Add items → Checkout
4. Pay after order acceptance
5. Track and rate completed orders

### Merchant

1. Register as Merchant
2. Wait for admin approval
3. Manage orders and menu via dashboard

### Super Admin

1. Register using admin invite code
2. Approve merchants
3. Manage users and canteens

---

## Key Design Decisions

| Feature        | Implementation              |
| -------------- | --------------------------- |
| Order handling | Supports partial acceptance |
| Notifications  | Polling (every few seconds) |
| Cart           | Session-based               |
| Ratings        | Only after order completion |
| Authentication | JWT-based                   |
| Payments       | Stripe integration        |

---


## API Overview

### Auth
- POST /api/auth/register — Register user  
- POST /api/auth/login — Login user  

### Orders
- POST /api/orders — Place order  
- GET /api/orders/:id — Get order details  
- PUT /api/orders/:id/status — Update order status  

### Payments
- POST /api/payments/initiate/:orderId — Create payment  
- POST /api/payments/verify — Verify payment  

### Admin
- GET /api/admin/dashboard — View system stats  


---

## Tech Stack

**Backend:**
Node.js · Express · MongoDB · Mongoose · JWT · bcrypt · Nodemailer · Stripe

**Frontend:**
React · Vite · TailwindCSS · Zustand · Axios · React Router · React Hot Toast

---

## Security Notes

* Do NOT expose API keys or secrets
* Use environment variables for all sensitive data
* Add `.env` to `.gitignore`
* Rotate keys if accidentally exposed

---

## Future Improvements

* Real-time updates using WebSockets
* Push notifications
* Order history analytics
* Better caching for performance

---

## License

MIT License
