const Product = require("../models/Product");
const Category = require("../models/Category");
const asyncHandler = require("../utils/asyncHandler");

// Only these fields can be set from the request body (blocks sneaky fields like merchant / ratings)
const ALLOWED_FIELDS = ["name", "description", "price", "discountPrice", "category", "stock", "images", "isActive"];

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const SORT_OPTIONS = {
  newest: "-createdAt",
  oldest: "createdAt",
  price_asc: "price -createdAt",
  price_desc: "-price -createdAt",
  rating: "-ratingsAverage -createdAt",
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const asString = (value) => (typeof value === "string" ? value : undefined);

const canManage = (user, product) =>
  user.role === "admin" || product.merchant.equals(user._id);

// GET /api/products?search=&category=&merchant=&minPrice=&maxPrice=&sort=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const search = asString(req.query.search);
  const category = asString(req.query.category);
  const merchant = asString(req.query.merchant);
  const sort = asString(req.query.sort) || "newest";
  const { minPrice, maxPrice } = req.query;

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);

  const filter = { isActive: true };

  if (search) filter.name = { $regex: escapeRegex(search), $options: "i" };
  if (category) filter.category = category;
  if (merchant) filter.merchant = merchant;

  if (minPrice !== undefined || maxPrice !== undefined) {
    const min = minPrice !== undefined ? Number(minPrice) : undefined;
    const max = maxPrice !== undefined ? Number(maxPrice) : undefined;

    if (Number.isNaN(min) || Number.isNaN(max)) {
      return res.status(400).json({ success: false, message: "minPrice and maxPrice must be numbers" });
    }

    filter.price = {};
    if (min !== undefined) filter.price.$gte = min;
    if (max !== undefined) filter.price.$lte = max;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .populate("merchant", "name shopName")
      .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    count: products.length,
    products,
  });
});

// GET /api/products/my  (merchant/admin: own products, including hidden ones)
exports.getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ merchant: req.user._id })
    .populate("category", "name slug")
    .sort("-createdAt");

  res.json({ success: true, count: products.length, products });
});

// GET /api/products/:id  (public)
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .populate("merchant", "name shopName");

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  res.json({ success: true, product });
});

// POST /api/products  (approved merchant / admin)
exports.createProduct = asyncHandler(async (req, res) => {
  const data = pick(req.body || {}, ALLOWED_FIELDS);

  const categoryExists = await Category.exists({ _id: data.category });
  if (!categoryExists) {
    return res.status(400).json({ success: false, message: "A valid category is required" });
  }

  const product = await Product.create({ ...data, merchant: req.user._id });
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id  (owner merchant / admin)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  if (!canManage(req.user, product)) {
    return res.status(403).json({ success: false, message: "You can only edit your own products" });
  }

  const data = pick(req.body || {}, ALLOWED_FIELDS);

  if (data.category) {
    const categoryExists = await Category.exists({ _id: data.category });
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: "A valid category is required" });
    }
  }

  product.set(data);
  await product.save();

  res.json({ success: true, product });
});

// DELETE /api/products/:id  (owner merchant / admin)
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }
  if (!canManage(req.user, product)) {
    return res.status(403).json({ success: false, message: "You can only delete your own products" });
  }

  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
});