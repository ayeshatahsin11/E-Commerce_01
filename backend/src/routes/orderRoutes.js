const router = require("express").Router();
const { protect, authorize, requireApprovedMerchant } = require("../middleware/auth");
const {
  placeOrder,
  getMyOrders,
  getOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const sellerOnly = [protect, authorize("merchant", "admin"), requireApprovedMerchant];

router.post("/", protect, authorize("user"), placeOrder);
router.get("/my", protect, authorize("user"), getMyOrders); // must be above "/:id"
router.get("/", ...sellerOnly, getOrders);
router.get("/:id", protect, getOrder);
router.patch("/:id/cancel", protect, authorize("user"), cancelOrder);
router.patch("/:id/status", ...sellerOnly, updateOrderStatus);

module.exports = router;