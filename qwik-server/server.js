const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const errorMiddleware = require("./src/middleware/error.middleware");

dotenv.config();
connectDB();

const app = express();

// ── Middleware ──────────────────────────────────────────────
//app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cors({
  origin: [process.env.CLIENT_URL, "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth",         require("./src/routes/auth.routes"));
app.use("/api/users",        require("./src/routes/user.routes"));
app.use("/api/canteens",     require("./src/routes/canteen.routes"));
app.use("/api/menu",         require("./src/routes/menu.routes"));
app.use("/api/orders",       require("./src/routes/order.routes"));
app.use("/api/reservations", require("./src/routes/reservation.routes"));
app.use("/api/payments",     require("./src/routes/payment.routes"));
app.use("/api/admin",        require("./src/routes/admin.routes"));

// ── Health check ────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

// ── Global error handler ────────────────────────────────────
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Qwik server running on port ${PORT}`));
