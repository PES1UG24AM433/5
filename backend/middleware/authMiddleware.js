
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function authenticateStaff(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.accountType !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Staff account required."
      });
    }

    if (!mongoose.isValidObjectId(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token."
      });
    }

    req.staff = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
}

function authorizeStaffRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.staff || !allowedRoles.includes(req.staff.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this operation."
      });
    }

    next();
  };
}

module.exports = { authenticateStaff, authorizeStaffRoles };
