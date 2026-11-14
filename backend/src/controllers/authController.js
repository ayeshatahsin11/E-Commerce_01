const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendToken, cookieOptions } = require("../utils/sendToken");

// Only accept real strings (blocks objects/arrays sent as email or password)
const asString = (value) => (typeof value === "string" ? value : undefined);

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = asString(body.name);
  const email = asString(body.email);
  const password = asString(body.password);
  const shopName = asString(body.shopName);

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, email and password are required" });
  }

  // Only "user" or "merchant" can self-register. Admin is never allowed here.
  const safeRole = body.role === "merchant" ? "merchant" : "user";

  if (safeRole === "merchant" && !(shopName && shopName.trim())) {
    return res.status(400).json({ success: false, message: "Shop name is required for merchants" });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password,
    role: safeRole,
    shopName: safeRole === "merchant" ? shopName.trim() : undefined,
    approvalStatus: safeRole === "merchant" ? "pending" : "approved",
  });

  sendToken(user, 201, res);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const email = asString((req.body || {}).email);
  const password = asString((req.body || {}).password);

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

// PUT /api/auth/profile   body: { name?, phone?, address?, city?, shopName? (merchant) }
// Email and role cannot be changed here.
exports.updateProfile = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const fields = ["name", "phone", "address", "city"];
  if (req.user.role === "merchant") fields.push("shopName");

  for (const field of fields) {
    if (body[field] === undefined) continue;

    const value = asString(body[field]);
    if (value === undefined) {
      return res.status(400).json({ success: false, message: `${field} must be text` });
    }
    req.user[field] = value;
  }

  if (req.user.role === "merchant" && !(req.user.shopName && req.user.shopName.trim())) {
    return res.status(400).json({ success: false, message: "Shop name cannot be empty" });
  }

  await req.user.save();
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/password   body: { currentPassword, newPassword }
exports.changePassword = asyncHandler(async (req, res) => {
  const currentPassword = asString((req.body || {}).currentPassword);
  const newPassword = asString((req.body || {}).newPassword);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Current password and new password are required" });
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: "New password must be different from the current one" });
  }

  user.password = newPassword; // length is checked by the model, then it is hashed on save
  await user.save();

  sendToken(user, 200, res); // fresh login cookie
});