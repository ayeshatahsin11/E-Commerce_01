const mongoose = require("mongoose");
const crypto = require("crypto");

// A copy of the product details at the time of purchase (later price/name changes don't affect old orders)
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    postalCode: { type: String, trim: true, maxlength: 20 },
  },
  { _id: false }
);

// One order per merchant: a checkout with items from 2 merchants creates 2 orders (same checkoutId)
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    checkoutId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    merchant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (list) => list.length > 0, message: "An order needs at least one item" },
    },
    shippingAddress: { type: addressSchema, required: true },
    paymentMethod: { type: String, enum: ["cod"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    total: { type: Number, required: true, min: 0 },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.pre("validate", function () {
  if (!this.orderNumber) {
    this.orderNumber = "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }
});

module.exports = mongoose.model("Order", orderSchema);