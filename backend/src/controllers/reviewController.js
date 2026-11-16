const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");

// Recalculates the product's average rating and review count
const refreshRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      ratingsAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
      numReviews: stats ? stats.count : 0,
    }
  );
};

// GET /api/products/:productId/reviews?page=&limit=   (public)
exports.getReviews = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
  const filter = { product: req.params.productId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("user", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), count: reviews.length, reviews });
});

// POST /api/products/:productId/reviews   body: { rating: 1-5, comment? }   (customer)
exports.addReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId).select("_id");
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const body = req.body || {};
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment : undefined;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be a whole number from 1 to 5" });
  }

  // only customers who received this product can review it
  const bought = await Order.exists({ user: req.user._id, status: "delivered", "items.product": product._id });
  if (!bought) {
    return res.status(403).json({ success: false, message: "You can review a product after your order with it is delivered" });
  }

  if (await Review.exists({ product: product._id, user: req.user._id })) {
    return res.status(409).json({ success: false, message: "You have already reviewed this product" });
  }

  const review = await Review.create({ product: product._id, user: req.user._id, rating, comment });
  await refreshRating(product._id);

  res.status(201).json({ success: true, review });
});

// DELETE /api/products/:productId/reviews/:reviewId   (the author or an admin)
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.productId });

  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }
  if (req.user.role !== "admin" && !review.user.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: "You can only delete your own review" });
  }

  await review.deleteOne();
  await refreshRating(review.product);

  res.json({ success: true, message: "Review deleted" });
});