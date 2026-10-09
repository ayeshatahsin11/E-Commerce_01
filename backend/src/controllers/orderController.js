const crypto = require("crypto");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { round2, unitPrice } = require("../utils/price");

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

// Which status can move to which
const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const asString = (value) => (typeof value === "string" ? value : undefined);

const getPaging = (query) => ({
  page: Math.max(parseInt(query.page) || 1, 1),
  limit: Math.min(Math.max(parseInt(query.limit) || 10, 1), 50),
});

// Give stock back (used when an order is cancelled or a checkout fails half-way)
const releaseStock = (items) =>
  Promise.all(items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })));

const cleanAddress = (input) => {
  if (!input || typeof input !== "object") return { error: "Shipping address is required" };

  const clean = {};
  for (const field of ["fullName", "phone", "address", "city"]) {
    const value = typeof input[field] === "string" ? input[field].trim() : "";
    if (!value) return { error: `Shipping address: ${field} is required` };
    clean[field] = value;
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(clean.phone)) return { error: "Please enter a valid phone number" };
  if (clean.fullName.length > 80) return { error: "Full name is too long" };
  if (clean.address.length > 250) return { error: "Address is too long" };
  if (clean.city.length > 60) return { error: "City name is too long" };

  if (typeof input.postalCode === "string" && input.postalCode.trim()) {
    clean.postalCode = input.postalCode.trim().slice(0, 20);
  }
  return { value: clean };
};

// Changes the status safely: only succeeds if the order still has the status we saw.
// This stops two parallel requests from, for example, giving the stock back twice.
const changeStatus = async (order, next) => {
  const set = { status: next };
  if (next === "delivered") {
    set.deliveredAt = new Date();
    set.paymentStatus = "paid"; // cash on delivery is paid at delivery
  }
  if (next === "cancelled") set.cancelledAt = new Date();

  const result = await Order.updateOne({ _id: order._id, status: order.status }, { $set: set });
  if (result.modifiedCount !== 1) return false;

  if (next === "cancelled") await releaseStock(order.items);
  return true;
};

// POST /api/orders   body: { shippingAddress: {...}, paymentMethod?: "cod" }
exports.placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = "cod" } = req.body || {};

  const address = cleanAddress(shippingAddress);
  if (address.error) {
    return res.status(400).json({ success: false, message: address.error });
  }
  if (paymentMethod !== "cod") {
    return res.status(400).json({ success: false, message: "Only cash on delivery (cod) is supported right now" });
  }

  // Take the items out of the cart in one atomic step, so a double click can't order twice
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, "items.0": { $exists: true } },
    { $set: { items: [] } }
  );
  if (!cart) {
    return res.status(400).json({ success: false, message: "Your cart is empty" });
  }

  const claimedItems = cart.items.map((item) => ({ product: item.product, quantity: item.quantity }));
  const checkoutId = crypto.randomUUID();
  const reserved = [];

  // If anything goes wrong: give stock back, remove half-created orders, put the items back in the cart
  const undo = async () => {
    await releaseStock(reserved);
    await Order.deleteMany({ checkoutId });
    await Cart.updateOne({ user: req.user._id, "items.0": { $exists: false } }, { $set: { items: claimedItems } });
  };

  try {
    const products = await Product.find({ _id: { $in: claimedItems.map((item) => item.product) } });
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    // 1) check every item
    const problems = [];
    for (const item of claimedItems) {
      const product = byId.get(item.product.toString());
      if (!product || !product.isActive) problems.push("An item in your cart is no longer available");
      else if (product.stock < item.quantity) {
        problems.push(product.stock === 0 ? `${product.name} is out of stock` : `${product.name}: only ${product.stock} left`);
      }
    }
    if (problems.length > 0) {
      await undo();
      return res.status(409).json({ success: false, message: problems.join("; "), problems });
    }

    // 2) reserve stock (atomic per product: it only succeeds while enough stock is left)
    for (const item of claimedItems) {
      const result = await Product.updateOne(
        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        await undo();
        const name = byId.get(item.product.toString()).name;
        return res.status(409).json({
          success: false,
          message: `Sorry, "${name}" just ran out of stock. Please review your cart.`,
        });
      }
      reserved.push(item);
    }

    // 3) one order per merchant
    const groups = new Map();
    for (const item of claimedItems) {
      const product = byId.get(item.product.toString());
      const key = product.merchant.toString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({
        product: product._id,
        name: product.name,
        image: product.images.length ? product.images[0].url : undefined,
        price: unitPrice(product),
        quantity: item.quantity,
      });
    }

    const orders = await Order.create(
      [...groups].map(([merchant, items]) => ({
        checkoutId,
        user: req.user._id,
        merchant,
        items,
        shippingAddress: address.value,
        paymentMethod,
        total: round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
      }))
    );

    res.status(201).json({
      success: true,
      checkoutId,
      grandTotal: round2(orders.reduce((sum, order) => sum + order.total, 0)),
      orders,
    });
  } catch (error) {
    await undo();
    throw error;
  }
});

// GET /api/orders/my?status=&page=&limit=   (customer: own orders)
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit } = getPaging(req.query);
  const filter = { user: req.user._id };

  const status = asString(req.query.status);
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status filter" });
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("merchant", "name shopName")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), count: orders.length, orders });
});

// GET /api/orders?status=&page=&limit=   (merchant: orders for their products, admin: all orders)
exports.getOrders = asyncHandler(async (req, res) => {
  const { page, limit } = getPaging(req.query);
  const isAdmin = req.user.role === "admin";
  const filter = isAdmin ? {} : { merchant: req.user._id };

  const status = asString(req.query.status);
  if (status !== undefined) {
    if (!STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status filter" });
    filter.status = status;
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", isAdmin ? "name email" : "name")
      .populate("merchant", "name shopName")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, total, page, pages: Math.ceil(total / limit), count: orders.length, orders });
});

// GET /api/orders/:id   (the customer, the merchant of that order, or an admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  const allowed =
    order && (req.user.role === "admin" || order.user.equals(req.user._id) || order.merchant.equals(req.user._id));

  if (!allowed) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  await order.populate([
    { path: "user", select: "name email" },
    { path: "merchant", select: "name shopName" },
  ]);
  res.json({ success: true, order });
});

// PATCH /api/orders/:id/cancel   (customer, only while the order is still pending)
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (order.status !== "pending") {
    return res.status(400).json({ success: false, message: "Only pending orders can be cancelled. Please contact the seller." });
  }

  if (!(await changeStatus(order, "cancelled"))) {
    return res.status(409).json({ success: false, message: "The order status just changed, please refresh" });
  }

  res.json({ success: true, order: await Order.findById(order._id) });
});

// PATCH /api/orders/:id/status   body: { status }   (merchant of that order, or admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};

  if (!STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(", ")}` });
  }

  const order = await Order.findById(req.params.id);

  if (!order || !(req.user.role === "admin" || order.merchant.equals(req.user._id))) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (!TRANSITIONS[order.status].includes(status)) {
    return res.status(400).json({ success: false, message: `Cannot change status from ${order.status} to ${status}` });
  }

  if (!(await changeStatus(order, status))) {
    return res.status(409).json({ success: false, message: "The order status just changed, please refresh" });
  }

  res.json({ success: true, order: await Order.findById(order._id) });
});