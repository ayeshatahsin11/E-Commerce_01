const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/admin/merchants?status=pending
exports.getMerchants = asyncHandler(async (req, res) => {
  const filter = { role: "merchant" };
  if (req.query.status) filter.approvalStatus = req.query.status;

  const merchants = await User.find(filter).sort("-createdAt");
  res.json({ success: true, count: merchants.length, merchants });
});

// PATCH /api/admin/merchants/:id/status   body: { "status": "approved" | "rejected" }
exports.updateMerchantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
  }

  const merchant = await User.findOne({ _id: req.params.id, role: "merchant" });

  if (!merchant) {
    return res.status(404).json({ success: false, message: "Merchant not found" });
  }

  merchant.approvalStatus = status;
  await merchant.save();

  res.json({ success: true, merchant });
});

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const asString = (value) => (typeof value === "string" ? value : undefined);

// GET /api/admin/users?role=&search=&isActive=&page=&limit=
exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const filter = {};

  const role = asString(req.query.role);
  if (role !== undefined) {
    if (!["user", "merchant", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "role must be user, merchant or admin" });
    }
    filter.role = role;
  }

  const isActive = asString(req.query.isActive);
  if (isActive !== undefined) {
    if (!["true", "false"].includes(isActive)) {
      return res.status(400).json({ success: false, message: "isActive must be true or false" });
    }
    filter.isActive = isActive === "true";
  }

  const search = asString(req.query.search);
  if (search) {
    const pattern = { $regex: escapeRegex(search), $options: "i" };
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), count: users.length, users });
});

// PATCH /api/admin/users/:id/status   body: { "isActive": true | false }
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body || {};

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ success: false, message: "isActive must be true or false" });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  if (user.role === "admin") {
    return res.status(400).json({ success: false, message: "Admin accounts cannot be deactivated" });
  }

  user.isActive = isActive;
  await user.save();

  res.json({ success: true, user });
});