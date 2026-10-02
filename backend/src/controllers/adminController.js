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
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
  }

  const merchant = await User.findOneAndUpdate(
    { _id: req.params.id, role: "merchant" },
    { approvalStatus: status },
    { new: true }
  );

  if (!merchant) {
    return res.status(404).json({ success: false, message: "Merchant not found" });
  }

  res.json({ success: true, merchant });
});