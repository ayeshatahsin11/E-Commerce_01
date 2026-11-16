const router = require("express").Router();
const { FREE_DELIVERY_ABOVE, ZONES, SLOTS } = require("../config/delivery");

// GET /api/delivery/options  (public: used by the checkout page)
router.get("/options", (req, res) => {
  res.json({ success: true, freeDeliveryAbove: FREE_DELIVERY_ABOVE, zones: ZONES, slots: SLOTS });
});

module.exports = router;