const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { round2, unitPrice } = require("../utils/price");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    try {
      cart = await Cart.create({ user: userId, items: [] });
    } catch (error) {
      if (error.code !== 11000) throw error;
      cart = await Cart.findOne({ user: userId }); // created by a parallel request
    }
  }
  return cart;
};

// Builds the response: current product info, prices, totals and any problems (deleted, hidden, low stock)
const buildCartView = async (cart) => {
  const ids = cart.items.map((item) => item.product);
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } }).select("name price discountPrice images stock isActive")
    : [];
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  let itemCount = 0;
  let canCheckout = cart.items.length > 0;

  const items = cart.items.map((item) => {
    const product = byId.get(item.product.toString());

    let issue = null;
    if (!product || !product.isActive) issue = "This product is no longer available";
    else if (product.stock === 0) issue = "Out of stock";
    else if (product.stock < item.quantity) issue = `Only ${product.stock} left in stock`;

    const price = product ? unitPrice(product) : 0;
    const lineTotal = round2(price * item.quantity);

    itemCount += item.quantity;
    if (issue) canCheckout = false;
    else subtotal += lineTotal;

    return {
      productId: item.product,
      name: product ? product.name : null,
      image: product && product.images.length ? product.images[0].url : null,
      unitPrice: price,
      originalPrice: product ? product.price : null,
      quantity: item.quantity,
      stock: product ? product.stock : 0,
      lineTotal,
      issue,
    };
  });

  return { items, itemCount, subtotal: round2(subtotal), canCheckout };
};

const parseQuantity = (value, fallback) => {
  if (value === undefined) return fallback;
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 1 ? quantity : null;
};

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, cart: await buildCartView(cart) });
});

// POST /api/cart/items   body: { productId, quantity? }
exports.addItem = asyncHandler(async (req, res) => {
  const { productId } = req.body || {};
  const quantity = parseQuantity((req.body || {}).quantity, 1);

  if (!productId) {
    return res.status(400).json({ success: false, message: "productId is required" });
  }
  if (quantity === null) {
    return res.status(400).json({ success: false, message: "Quantity must be a whole number of at least 1" });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => item.product.equals(product._id));
  const newQuantity = (existing ? existing.quantity : 0) + quantity;

  if (newQuantity > product.stock) {
    return res.status(400).json({
      success: false,
      message: product.stock === 0 ? "This product is out of stock" : `Only ${product.stock} in stock`,
    });
  }

  if (existing) existing.quantity = newQuantity;
  else cart.items.push({ product: product._id, quantity });

  await cart.save();
  res.status(201).json({ success: true, cart: await buildCartView(cart) });
});

// PATCH /api/cart/items/:productId   body: { quantity }
exports.updateItem = asyncHandler(async (req, res) => {
  const quantity = parseQuantity((req.body || {}).quantity, null);

  if (quantity === null) {
    return res.status(400).json({ success: false, message: "Quantity must be a whole number of at least 1 (use DELETE to remove)" });
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => entry.product.equals(req.params.productId));

  if (!item) {
    return res.status(404).json({ success: false, message: "Item is not in your cart" });
  }

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    return res.status(400).json({ success: false, message: "This product is no longer available" });
  }
  if (quantity > product.stock) {
    return res.status(400).json({ success: false, message: `Only ${product.stock} in stock` });
  }

  item.quantity = quantity;
  await cart.save();
  res.json({ success: true, cart: await buildCartView(cart) });
});

// DELETE /api/cart/items/:productId
exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => entry.product.equals(req.params.productId));

  if (!item) {
    return res.status(404).json({ success: false, message: "Item is not in your cart" });
  }

  cart.items = cart.items.filter((entry) => !entry.product.equals(req.params.productId));
  await cart.save();
  res.json({ success: true, cart: await buildCartView(cart) });
});

// DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, cart: await buildCartView(cart) });
});