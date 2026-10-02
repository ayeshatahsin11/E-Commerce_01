const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendToken, cookieOptions } = require("../utils/sendToken");

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, shopName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  // Only "user" or "merchant" can self-register. Admin is never allowed here.
  const safeRole = role === "merchant" ? "merchant" : "user";

  if (safeRole === "merchant" && !shopName) {
    return res.status(400).json({ success: false, message: "Shop name is required for merchants" });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: safeRole,
    shopName: safeRole === "merchant" ? shopName : undefined,
    approvalStatus: safeRole === "merchant" ? "pending" : "approved",
  });

  sendToken(user, 201, res);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: "Your account has been deactivated" });
  }

  sendToken(user, 200, res);
});

// POST /api/auth/logout
exports.logout = (req, res) => {
  res.clearCookie("token", cookieOptions).json({ success: true, message: "Logged out" });
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  res.json({ success: true, user: req.user });
};