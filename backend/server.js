
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const staffAuthRoutes = require("./routes/staffAuthRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const menuRoutes = require("./routes/menuRoutes");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/staff/auth", staffAuthRoutes);
app.use("/api/auth", studentAuthRoutes);
app.use("/api/menu", menuRoutes);

app.get("/", (req, res) => {
  res.send("Canteen Pre-Order System API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend server is healthy" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
