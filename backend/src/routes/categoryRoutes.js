const router = require("express").Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

router.get("/", getCategories);

router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;