const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");

// only customers have a wishlist
router.use(protect, authorize("user"));

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;