const router = require("express").Router();
const { protect, authorize, requireApprovedMerchant } = require("../middleware/auth");
const {
  getDashboard,
  getUserDashboard,
  getMerchantDashboard,
  getAdminDashboard,
} = require("../controllers/dashboardController");

router.get("/", protect, requireApprovedMerchant, getDashboard); // auto-picks by role
router.get("/user", protect, authorize("user"), getUserDashboard);
router.get("/merchant", protect, authorize("merchant"), requireApprovedMerchant, getMerchantDashboard);
router.get("/admin", protect, authorize("admin"), getAdminDashboard);

module.exports = router;