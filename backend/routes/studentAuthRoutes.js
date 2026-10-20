const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const Student = require("../models/Student");
const { authenticateStudent } = require("../middleware/studentAuthMiddleware");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email and password.",
        errors: errors.array().map((error) => error.msg)
      });
    }

    try {
      const email = req.body.email.trim().toLowerCase();
      const student = await Student.findOne({ email });
      const passwordMatches = student
        ? await bcrypt.compare(req.body.password, student.password)
        : false;

      if (!student || !passwordMatches) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password."
        });
      }

      const token = jwt.sign(
        {
          id: student._id.toString(),
          accountType: "student",
          name: student.name,
          studentId: student.studentId,
          email: student.email
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        success: true,
        message: "Login successful.",
        token,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          studentId: student.studentId
        }
      });
    } catch (error) {
      console.error("Student login error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to log in. Please try again."
      });
    }
  }
);

router.get("/me", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.student.id).select(
      "-password"
    );

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Student account no longer exists."
      });
    }

    return res.json({ success: true, student });
  } catch (error) {
    console.error("Student verification error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to verify student account."
    });
  }
});

module.exports = router;
