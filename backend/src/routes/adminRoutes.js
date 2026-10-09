const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getMerchants, updateMerchantStatus, getUsers, updateUserStatus } = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/merchants", getMerchants);
router.patch("/merchants/:id/status", updateMerchantStatus);

router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);

module.exports = router;