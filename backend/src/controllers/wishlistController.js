const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: "products",
    match: { isActive: true },
    select: "name price discountPrice images stock unit minOrderQty step isOrganic ratingsAverage numReviews",
  });

  const products = wishlist ? wishlist.products : [];
  res.json({ success: true, count: products.length, products });
});

// POST /api/wishlist/:productId
exports.addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select("isActive");

  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  await Wishlist.updateOne({ user: req.user._id }, { $addToSet: { products: product._id } }, { upsert: true });
  res.status(201).json({ success: true, message: "Added to wishlist" });
});

// DELETE /api/wishlist/:productId
exports.removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  res.json({ success: true, message: "Removed from wishlist" });
});