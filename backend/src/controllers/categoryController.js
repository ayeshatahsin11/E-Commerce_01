const Category = require("../models/Category");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/categories  (public)
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort("name");
  res.json({ success: true, count: categories.length, categories });
});

// POST /api/categories  (admin)
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body || {};

  if (!name) {
    return res.status(400).json({ success: false, message: "Category name is required" });
  }

  const category = await Category.create({ name, description });
  res.status(201).json({ success: true, category });
});

// PUT /api/categories/:id  (admin)
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  const { name, description } = req.body || {};
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;

  await category.save();
  res.json({ success: true, category });
});

// DELETE /api/categories/:id  (admin)
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  const inUse = await Product.countDocuments({ category: category._id });
  if (inUse > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete: ${inUse} product(s) use this category`,
    });
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
});