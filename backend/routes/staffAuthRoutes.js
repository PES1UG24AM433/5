
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Staff = require("../models/Staff");
const {
  authenticateStaff
} = require("../middleware/authMiddleware");

const router = express.Router();

// Staff login
router.post(
  "/login",
  [
    body("email").isString().withMessage("Enter a valid email").trim().isEmail().withMessage("Enter a valid email"),
    body("password").isString().withMessage("Password is required").notEmpty().withMessage("Password is required")
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid login details."
      });
    }

    try {
      const email = req.body.email.trim().toLowerCase();
      const { password } = req.body;

      const staff = await Staff.findOne({ email });

      if (!staff || !(await bcrypt.compare(password, staff.password))) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password."
        });
      }

      if (!process.env.JWT_SECRET) {
        console.error("Staff login error: JWT_SECRET is not configured.");
        return res.status(500).json({
          success: false,
          message: "Unable to log in. Please try again."
        });
      }

      const token = jwt.sign(
        {
          id: staff._id.toString(),
          accountType: "staff",
          role: staff.role
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        success: true,
        message: "Staff login successful.",
        token,
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role
        }
      });
    } catch (error) {
      console.error("Staff login error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to log in. Please try again."
      });
    }
  }
);

// Verify a logged-in staff token
router.get("/me", authenticateStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staff.id).select(
      "-password"
    );

    if (!staff) {
      return res.status(401).json({
        success: false,
        message: "Staff account no longer exists."
      });
    }

    return res.json({
      success: true,
      staff
    });
  } catch (error) {
    console.error("Staff verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify staff account."
    });
  }
});
router.get(
  "/test-protected",
  authenticateStaff,
  (req, res) => {
    res.json({
      success: true,
      message: "Staff-only access granted.",
      staffId: req.staff.id,
      role: req.staff.role
    });
  }
);
module.exports = router;
