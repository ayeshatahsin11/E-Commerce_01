const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
        images: {
      type: [{ type: String, trim: true }],
      validate: { validator: (list) => list.length <= 5, message: "A product can have at most 5 images" },
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
      default: 0,
    },
    isActive: { type: Boolean, default: true },
    ratingsAverage: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ merchant: 1 });
productSchema.index({ price: 1 });

// discountPrice must always be lower than price (also checked when only price changes)
productSchema.pre("validate", function () {
  if (this.discountPrice != null && this.discountPrice >= this.price) {
    this.invalidate("discountPrice", "Discount price must be less than price");
  }
});

module.exports = mongoose.model("Product", productSchema);
