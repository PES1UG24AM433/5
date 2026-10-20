
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const staffAuthRoutes = require("./routes/staffAuthRoutes");


const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/staff/auth", staffAuthRoutes);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

app.get("/", (req, res) => {
  res.send("Canteen Pre-Order System API is running!");
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend server is healthy" });
});

app.post(
  "/api/auth/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Enter a valid email"),
    body("studentId").trim().notEmpty().withMessage("Student ID is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please correct the registration details",
        errors: errors.array().map((error) => error.msg)
      });
    }

    try {
      const name = req.body.name.trim();
      const email = req.body.email.trim().toLowerCase();
      const studentId = req.body.studentId.trim();

      const existingStudent = await Student.findOne({
        $or: [{ email }, { studentId }]
      });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "An account with this email or student ID already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, 12);

      await Student.create({
        name,
        email,
        studentId,
        password: hashedPassword
      });

      return res.status(201).json({
        success: true,
        message: "Student registered successfully"
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "An account with these details already exists"
        });
      }

      console.error("Registration error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Registration failed. Please try again."
      });
    }
  }
);

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
