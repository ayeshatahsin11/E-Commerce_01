const router = require("express").Router();
const { protect, authorize, requireApprovedMerchant } = require("../middleware/auth");
const {
  getProducts,
  getMyProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImages,
  removeProductImage,
} = require("../controllers/productController");
const { getReviews, addReview, deleteReview } = require("../controllers/reviewController");
const { uploadProductImages } = require("../middleware/upload");

const sellerOnly = [protect, authorize("merchant", "admin"), requireApprovedMerchant];

router.get("/", getProducts);
router.get("/my", protect, authorize("merchant", "admin"), getMyProducts); // must be above "/:id"
router.get("/:id", getProduct);

router.post("/", ...sellerOnly, createProduct);
router.put("/:id", ...sellerOnly, updateProduct);
router.delete("/:id", ...sellerOnly, deleteProduct);

// auth + role checks run BEFORE multer, so strangers can't write files to the server
router.post("/:id/images", ...sellerOnly, uploadProductImages, addProductImages);
router.delete("/:id/images/:imageId", ...sellerOnly, removeProductImage);

// reviews
router.get("/:productId/reviews", getReviews);
router.post("/:productId/reviews", protect, authorize("user"), addReview);
router.delete("/:productId/reviews/:reviewId", protect, deleteReview);

module.exports = router;