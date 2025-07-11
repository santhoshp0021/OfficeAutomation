const jwt = require("jsonwebtoken");
const Student = require("../models/student.js");
const Faculty = require("../models/Faculty.js");

const User = require("../models/User.js");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: "Forbidden: insufficient role" });
  }
  next();
};

const requireRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };

const allowSelfOrAdmin =
  (model, idField = "id", paramKey = "id") =>
  async (req, res, next) => {
    if (req.user.role === "admin") return next();
    try {
      const doc = await model.findById(req.params[paramKey]);
      if (!doc) return res.status(404).json({ error: "Resource not found" });
      if (doc[idField] === req.user.id) return next();
      return res.status(403).json({ error: "Forbidden: not your resource" });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  };

module.exports = {
  verifyToken,
  requireRole,
  requireRoles,
  allowSelfOrAdmin,
};
