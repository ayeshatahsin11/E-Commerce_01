const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Checks the user is logged in
exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Please log in first" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User no longer exists or is deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Checks the user's role: authorize("admin"), authorize("merchant", "admin")
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not allowed to access this route`,
    });
  }
  next();
};

// Blocks merchants who are not approved yet (admins pass through)
exports.requireApprovedMerchant = (req, res, next) => {
  if (req.user.role === "merchant" && req.user.approvalStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: `Your merchant account is ${req.user.approvalStatus}`,
    });
  }
  next();
};