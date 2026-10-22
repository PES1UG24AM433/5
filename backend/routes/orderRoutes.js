const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const { authenticateStudent } = require("../middleware/studentAuthMiddleware");
const {
  authenticateStaff,
  authorizeStaffRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Staff-only incoming order queue.
// This route must appear before /:orderId so "incoming" is not treated as an order ID.
router.get(
  "/incoming",
  authenticateStaff,
  authorizeStaffRoles("staff", "manager"),
  async (req, res) => {
    try {
      const orders = await Order.find({
        status: "Placed"
      })
        .sort({ orderTime: 1 })
        .lean();

      return res.json({
        success: true,
        orders: orders.map((order) => ({
          id: order._id,
          studentId: order.studentId,
          studentName: order.studentName,
          studentEmail: order.studentEmail,
          items: order.items,
          totalAmount: order.totalAmount,
          orderTime: order.orderTime,
          status: order.status,
          paymentStatus: order.paymentStatus
        }))
      });
    } catch (error) {
      console.error("Incoming order queue error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve incoming orders."
      });
    }
  }
);

router.get("/", authenticateStudent, async (req, res) => {
  try {
    const orders = await Order.find({
      studentId: req.student.studentId,
      studentEmail: req.student.email
    })
      .sort({ orderTime: -1 })
      .lean();

    return res.json({
      success: true,
      orders: orders.map((order) => ({
        id: order._id,
        items: order.items,
        totalAmount: order.totalAmount,
        orderTime: order.orderTime,
        status: order.status,
        paymentStatus: order.paymentStatus
      }))
    });
  } catch (error) {
    console.error("Order history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order history."
    });
  }
});

router.get("/:orderId", authenticateStudent, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.orderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID."
    });
  }

  try {
    const order = await Order.findById(req.params.orderId).lean();

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

    return res.json({
      success: true,
      order: {
        id: order._id,
        items: order.items,
        totalAmount: order.totalAmount,
        orderTime: order.orderTime,
        status: order.status,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    console.error("Order lookup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the order."
    });
  }
});

router.post(
  "/",
  authenticateStudent,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Your order must contain at least one item"),
    body("items.*.productId")
      .isMongoId()
      .withMessage("Each item must have a valid product ID"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Each quantity must be a positive whole number")
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please correct the order details.",
        errors: errors.array().map((error) => error.msg)
      });
    }

    try {
      const { items } = req.body;

      // Combine duplicate product IDs so stock and totals are checked correctly.
      const quantities = new Map();

      for (const item of items) {
        const id = item.productId;
        quantities.set(id, (quantities.get(id) || 0) + Number(item.quantity));
      }

      const orderItems = [];
      let totalAmount = 0;

      for (const [productId, quantity] of quantities) {
        const menuItem = await MenuItem.findById(productId);

        if (!menuItem) {
          return res.status(404).json({
            success: false,
            message: "A selected menu item was not found."
          });
        }

        if (!menuItem.available) {
          return res.status(409).json({
            success: false,
            message: `${menuItem.name} is currently unavailable.`
          });
        }

        if (quantity > menuItem.stock) {
          return res.status(409).json({
            success: false,
            message: `Only ${menuItem.stock} portion(s) of ${menuItem.name} are available.`
          });
        }

        const unitPricePaise = Math.round(menuItem.price * 100);
        const subtotalPaise = unitPricePaise * quantity;

        const subtotal = subtotalPaise / 100;
        totalAmount = Math.round(totalAmount * 100 + subtotalPaise) / 100;

        orderItems.push({
          productId: menuItem._id,
          name: menuItem.name,
          quantity,
          unitPrice: menuItem.price,
          subtotal
        });
      }

      const order = await Order.create({
        studentId: req.student.studentId,
        studentName: req.student.name,
        studentEmail: req.student.email,
        items: orderItems,
        totalAmount
      });

      return res.status(201).json({
        success: true,
        message: "Pre-order placed successfully.",
        order: {
          id: order._id,
          studentId: order.studentId,
          studentName: order.studentName,
          studentEmail: order.studentEmail,
          items: order.items,
          totalAmount: order.totalAmount,
          orderTime: order.orderTime,
          status: order.status,
          paymentStatus: order.paymentStatus
        }
      });
    } catch (error) {
      console.error("Order placement error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to place your order. Please try again."
      });
    }
  }
);

router.patch(
  "/:orderId/cancel",
  authenticateStudent,
  async (req, res) => {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
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

      if (order.status !== "Placed") {
        return res.status(409).json({
          success: false,
          message: `This order cannot be cancelled because its status is ${order.status}.`
        });
      }

      order.status = "Cancelled";
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Your order has been cancelled successfully.",
        order: {
          id: order._id,
          status: order.status
        }
      });
    } catch (error) {
      console.error("Order cancellation error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel the order. Please try again."
      });
    }
  }
);

module.exports = router;
