const router = require("express").Router();
const { protect, authorize, requireApprovedMerchant } = require("../middleware/auth");
const {
  getProducts,
  getMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const sellerOnly = [protect, authorize("merchant", "admin"), requireApprovedMerchant];

router.get("/", getProducts);
router.get("/my", protect, authorize("merchant", "admin"), getMyProducts); // must be above "/:id"
router.get("/:id", getProduct);

router.post("/", ...sellerOnly, createProduct);
router.put("/:id", ...sellerOnly, updateProduct);
router.delete("/:id", ...sellerOnly, deleteProduct);

module.exports = router;