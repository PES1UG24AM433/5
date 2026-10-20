
const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { authenticateStudent } = require("../middleware/studentAuthMiddleware");

const router = express.Router();

// Simulated payment endpoint
router.post("/:orderId", authenticateStudent, async (req, res) => {
  const { orderId } = req.params;
  const { outcome } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID."
    });
  }

  if (!["success", "failure"].includes(outcome)) {
    return res.status(400).json({
      success: false,
      message: "Outcome must be 'success' or 'failure'."
    });
  }

  try {
    const order = await Order.findById(orderId);

    if (
      !order ||
      order.studentId !== req.student.studentId ||
      order.studentEmail !== req.student.email
    ) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    if (order.paymentStatus !== "Pending") {
      return res.status(409).json({
        success: false,
        message: `Payment has already been recorded as ${order.paymentStatus}.`,
        paymentStatus: order.paymentStatus
      });
    }

    order.paymentStatus = outcome === "success" ? "Success" : "Failed";
    await order.save();

    return res.status(200).json({
      success: true,
      message: outcome === "success"
        ? "Simulated payment successful."
        : "Simulated payment failed.",
      orderId: order._id,
      paymentStatus: order.paymentStatus
    });
  } catch (error) {
    console.error("Payment processing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to record payment status."
    });
  }
});

module.exports = router;
