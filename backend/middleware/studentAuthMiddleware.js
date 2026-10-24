const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function authenticateStudent(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in."
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.accountType !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student account required."
      });
    }

    if (!mongoose.isValidObjectId(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token."
      });
    }

    req.student = {
      id: decoded.id,
      name: decoded.name,
      studentId: decoded.studentId,
      email: decoded.email
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
}

module.exports = { authenticateStudent };
