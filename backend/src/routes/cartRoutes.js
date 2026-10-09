const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { getCart, addItem, updateItem, removeItem, clearCart } = require("../controllers/cartController");

// only customers (role "user") have a cart
router.use(protect, authorize("user"));

router.get("/", getCart);
router.delete("/", clearCart);
router.post("/items", addItem);
router.patch("/items/:productId", updateItem);
router.delete("/items/:productId", removeItem);

module.exports = router;