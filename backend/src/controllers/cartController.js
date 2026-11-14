const Cart = require("../models/Cart");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");
const { round2, unitPrice } = require("../utils/price");
const { round3, hasStock, checkQuantity } = require("../utils/quantity");
const { FREE_DELIVERY_ABOVE } = require("../config/delivery");

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

const stockMessage = (product) =>
  product.stock < 0.001 ? "This product is out of stock" : `Only ${product.stock} ${product.unit} in stock`;

// Builds the response: current product info, prices, totals and any problems (deleted, hidden, low stock)
const buildCartView = async (cart) => {
  const ids = cart.items.map((item) => item.product);
  const products = ids.length
    ? await Product.find({ _id: { $in: ids } }).select(
        "name price discountPrice images stock isActive unit minOrderQty step"
      )
    : [];
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  let canCheckout = cart.items.length > 0;

  const items = cart.items.map((item) => {
    const product = byId.get(item.product.toString());

    let issue = null;
    if (!product || !product.isActive) issue = "This product is no longer available";
    else if (product.stock < 0.001) issue = "Out of stock";
    else if (!hasStock(product.stock, item.quantity)) issue = `Only ${product.stock} ${product.unit} left in stock`;

    const price = product ? unitPrice(product) : 0;
    const lineTotal = round2(price * item.quantity);

    if (issue) canCheckout = false;
    else subtotal += lineTotal;

    return {
      productId: item.product,
      name: product ? product.name : null,
      image: product && product.images.length ? product.images[0].url : null,
      unit: product ? product.unit : null,
      minOrderQty: product ? product.minOrderQty : null,
      step: product ? product.step : null,
      unitPrice: price, // price per unit
      originalPrice: product ? product.price : null,
      quantity: item.quantity,
      stock: product ? product.stock : 0,
      lineTotal,
      issue,
    };
  });

  return {
    items,
    itemCount: items.length, // number of different products (for the navbar badge)
    subtotal: round2(subtotal),
    freeDeliveryAbove: FREE_DELIVERY_ABOVE, // frontend can show "add X more for free delivery"
    canCheckout,
  };
};

// GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  res.json({ success: true, cart: await buildCartView(cart) });
});

// POST /api/cart/items   body: { productId, quantity? }   (quantity defaults to the product's minimum)
exports.addItem = asyncHandler(async (req, res) => {
  const { productId, quantity: rawQuantity } = req.body || {};

  if (!productId) {
    return res.status(400).json({ success: false, message: "productId is required" });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const checked = checkQuantity(product, rawQuantity === undefined ? product.minOrderQty : rawQuantity);
  if (checked.error) {
    return res.status(400).json({ success: false, message: checked.error });
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find((item) => item.product.equals(product._id));
  const newQuantity = round3((existing ? existing.quantity : 0) + checked.value);

  if (!hasStock(product.stock, newQuantity)) {
    return res.status(400).json({ success: false, message: stockMessage(product) });
  }

  if (existing) existing.quantity = newQuantity;
  else cart.items.push({ product: product._id, quantity: checked.value });

  await cart.save();
  res.status(201).json({ success: true, cart: await buildCartView(cart) });
});

// PATCH /api/cart/items/:productId   body: { quantity }
exports.updateItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((entry) => entry.product.equals(req.params.productId));

  if (!item) {
    return res.status(404).json({ success: false, message: "Item is not in your cart" });
  }

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    return res.status(400).json({ success: false, message: "This product is no longer available" });
  }

  const checked = checkQuantity(product, (req.body || {}).quantity);
  if (checked.error) {
    return res.status(400).json({ success: false, message: checked.error });
  }
  if (!hasStock(product.stock, checked.value)) {
    return res.status(400).json({ success: false, message: stockMessage(product) });
  }

  item.quantity = checked.value;
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