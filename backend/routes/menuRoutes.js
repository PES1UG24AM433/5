
const express = require("express");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const MenuItem = require("../models/MenuItem");
const {
  authenticateStaff
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public: view menu items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find()
      .select("_id name price foodType available stock")
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error("Menu fetch error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch menu items."
    });
  }
});

// Staff only: add a menu item
router.post(
  "/",
  authenticateStaff,
  [
    body("name").trim().notEmpty().withMessage("Item name is required"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be non-negative"),
    body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative whole number"),
    body("foodType").optional().isIn(["Veg", "Non-Veg"]).withMessage("Food type must be Veg or Non-Veg"),
    body("available").optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please correct the menu item details.",
        errors: errors.array().map((error) => error.msg)
      });
    }

    try {
      const { name, price, stock, foodType, available = true } = req.body;

      const item = await MenuItem.create({
        name: name.trim(),
        price: Number(price),
        stock: Number(stock),
        foodType,
        available
      });

      return res.status(201).json({
        success: true,
        message: "Menu item added successfully.",
        item
      });
    } catch (error) {
      console.error("Add menu item error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Unable to add menu item."
      });
    }
  }
);

// Staff only: update a menu item
router.patch(
  "/:id",
  authenticateStaff,
  [
    body("name").optional().trim().notEmpty(),
    body("price").optional().isFloat({ min: 0 }),
    body("stock").optional().isInt({ min: 0 }),
    body("foodType").optional().isIn(["Veg", "Non-Veg"]),
    body("available").optional().isBoolean()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item details.",
        errors: errors.array().map((error) => error.msg)
      });
    }

    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update."
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID."
      });
    }

    try {
      const item = await MenuItem.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        {
          new: true,
          runValidators: true,
          strict: true
        }
      );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Menu item not found."
        });
      }

      return res.json({
        success: true,
        message: "Menu item updated successfully.",
        item
      });
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid menu item ID."
        });
      }

      console.error("Update menu item error:", error.message);
      return res.status(400).json({
        success: false,
        message: "Unable to update menu item."
      });
    }
  }
);

// Staff only: remove a menu item
router.delete("/:id", authenticateStaff, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid menu item ID."
    });
  }

  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found."
      });
    }

    return res.json({
      success: true,
      message: "Menu item removed successfully."
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID."
      });
    }

    console.error("Delete menu item error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to remove menu item."
    });
  }
});

module.exports = router;
