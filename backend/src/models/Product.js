const mongoose = require("mongoose");
const { isMultipleOf } = require("../utils/quantity");

const UNITS = ["kg", "g", "piece", "dozen", "bunch", "litre"];
const FRESHNESS = ["none", "fresh_today", "seasonal"];

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true, maxlength: 120 },
    description: { type: String, required: [true, "Description is required"], trim: true, maxlength: 2000 },

    // price is per ONE unit (e.g. 80 taka per kg)
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    discountPrice: { type: Number, min: [0, "Discount price cannot be negative"] },

    // how the product is sold
    unit: {
      type: String,
      enum: { values: UNITS, message: `Unit must be one of: ${UNITS.join(", ")}` },
      default: "kg",
    },
    minOrderQty: { type: Number, min: [0.01, "Minimum order quantity is too small"], default: 1 },
    step: { type: Number, min: [0.01, "Step is too small"], default: 1 }, // 0.5 => 0.5, 1, 1.5 ...

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: [true, "Category is required"] },
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    images: {
      type: [imageSchema],
      validate: { validator: (list) => list.length <= 5, message: "A product can have at most 5 images" },
    },

    // stock is in the same unit (can be decimal, e.g. 12.5 kg)
    stock: { type: Number, required: [true, "Stock is required"], min: [0, "Stock cannot be negative"], default: 0 },

    // veggie-shop extras
    isOrganic: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false }, // only admin can set this
    origin: { type: String, trim: true, maxlength: 80 }, // farm / district
    freshness: {
      type: String,
      enum: { values: FRESHNESS, message: `Freshness must be one of: ${FRESHNESS.join(", ")}` },
      default: "none",
    },

    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.index({ merchant: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1 });

productSchema.pre("validate", function () {
  // discountPrice must always be lower than price
  if (this.discountPrice != null && this.discountPrice >= this.price) {
    this.invalidate("discountPrice", "Discount price must be less than price");
  }
  // minOrderQty must fit the step (min 0.5 with step 0.5 is fine, min 0.3 with step 0.5 is not)
  if (this.minOrderQty != null && this.step != null && !isMultipleOf(this.minOrderQty, this.step)) {
    this.invalidate("minOrderQty", "Minimum order quantity must be a multiple of the step");
  }
});

module.exports = mongoose.model("Product", productSchema);