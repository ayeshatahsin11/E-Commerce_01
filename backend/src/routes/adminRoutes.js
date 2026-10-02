const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getMerchants, updateMerchantStatus } = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/merchants", getMerchants);
router.patch("/merchants/:id/status", updateMerchantStatus);

module.exports = router;