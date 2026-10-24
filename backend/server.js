
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
app.use(express.json({ limit: "100kb" }));
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Request body must contain valid JSON."
    });
  }
  return next(error);
});
app.use((req, res, next) => {
  if (req.body === null || Array.isArray(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a JSON object."
    });
  }
  return next();
});
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

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "The requested endpoint was not found."
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled request error:", error.message);
  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred. Please try again."
  });
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
