const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const { uploadBannerImage } = require("../middleware/upload");
const {
  getBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController");

router.get("/", getBanners);
router.get("/all", protect, authorize("admin"), getAllBanners); // must be above "/:id"

// auth runs BEFORE multer, so strangers can't upload files
router.post("/", protect, authorize("admin"), uploadBannerImage, createBanner);
router.put("/:id", protect, authorize("admin"), uploadBannerImage, updateBanner);
router.delete("/:id", protect, authorize("admin"), deleteBanner);

module.exports = router;