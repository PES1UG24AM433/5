
const express = require("express");
const mongoose = require("mongoose");
const MenuItem = require("../models/MenuItem");

const router = express.Router();

router.post("/validate", async (req, res) => {
  const items = req.body.items;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      valid: false,
      message: "Your cart is empty. Add items before checkout."
    });
  }

  for (const item of items) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !mongoose.isValidObjectId(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return res.status(400).json({
        valid: false,
        message: "Each item must have a valid product ID and a positive whole-number quantity."
      });
    }
  }

  try {
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.productId);

      if (!menuItem) {
        return res.status(404).json({
          valid: false,
          message: "A selected item was not found on the menu."
        });
      }

      if (!menuItem.available) {
        return res.status(409).json({
          valid: false,
          message: `${menuItem.name} is currently unavailable. Please remove it from your cart.`
        });
      }

      if (item.quantity > menuItem.stock) {
        return res.status(409).json({
          valid: false,
          message: `Only ${menuItem.stock} portion(s) of ${menuItem.name} are available. Please update your quantity.`
        });
      }
    }

    return res.status(200).json({
      valid: true,
      message: "Your cart is valid. You can proceed to checkout."
    });
  } catch (error) {
    console.error("Cart validation error:", error.message);

    return res.status(500).json({
      valid: false,
      message: "Unable to validate your cart right now. Please try again."
    });
  }
});

module.exports = router;
