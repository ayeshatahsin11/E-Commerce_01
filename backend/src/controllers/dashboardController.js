const User = require("../models/User");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const asyncHandler = require("../utils/asyncHandler");
const { unitPrice } = require("../utils/price");
const { LOW_STOCK_LIMIT, getTimezone, summarizeOrders, topProducts } = require("../utils/stats");

const loadOrders = (filter) => Order.find(filter).sort("-createdAt").lean();

const unitsIn = (order) => order.items.reduce((sum, item) => sum + item.quantity, 0);

// id -> { name, shopName, ... } for a list of user ids
const usersById = async (ids, fields) => {
  const unique = [...new Set(ids.map(String))];
  if (unique.length === 0) return new Map();
  const users = await User.find({ _id: { $in: unique } }).select(fields).lean();
  return new Map(users.map((user) => [String(user._id), user]));
};

const respond = (req, res, dashboard) =>
  res.json({
    success: true,
    role: req.user.role,
    timezone: getTimezone(),
    generatedAt: new Date().toISOString(),
    dashboard,
  });

// GET /api/dashboard/user  — the customer's own view
exports.getUserDashboard = asyncHandler(async (req, res) => {
  const orders = await loadOrders({ user: req.user._id });
  const summary = summarizeOrders(orders, { timezone: getTimezone() });
  const recent = orders.slice(0, 5);
  const favourites = topProducts(orders, 5);

  const [shops, cart, currentProducts] = await Promise.all([
    usersById(recent.map((order) => order.merchant), "name shopName"),
    Cart.findOne({ user: req.user._id }).lean(),
    favourites.length
      ? Product.find({ _id: { $in: favourites.map((f) => f.productId) } })
          .select("isActive stock price discountPrice")
          .lean()
      : [],
  ]);
  const currentById = new Map(currentProducts.map((product) => [String(product._id), product]));

  respond(req, res, {
    profile: { name: req.user.name, email: req.user.email, memberSince: req.user.createdAt },
    orders: summary.orders,
    spending: {
      totalSpent: summary.money.revenue, // delivered orders
      pendingPayment: summary.money.outstanding, // active orders, to be paid on delivery
      thisMonthSpent: summary.money.thisMonthSales,
      averageOrderValue: summary.money.averageOrderValue,
    },
    spendingByMonth: summary.salesByMonth.map((m) => ({ month: m.month, orders: m.orders, spent: m.sales })),
    recentOrders: recent.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      itemCount: unitsIn(order),
      shop: shops.get(String(order.merchant))?.shopName || null,
      createdAt: order.createdAt,
    })),
    // products this customer bought most, with whether they can be bought again right now
    buyAgain: favourites.map((favourite) => {
      const product = currentById.get(String(favourite.productId));
      return {
        productId: favourite.productId,
        name: favourite.name,
        image: favourite.image,
        timesBought: favourite.units,
        available: Boolean(product && product.isActive && product.stock > 0),
        currentPrice: product ? unitPrice(product) : null,
      };
    }),
    cart: {
      lines: cart ? cart.items.length : 0,
      units: cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
    },
  });
});

// GET /api/dashboard/merchant  — the seller's shop
exports.getMerchantDashboard = asyncHandler(async (req, res) => {
  const mine = { merchant: req.user._id };

  const [orders, total, active, outOfStock, lowStock, lowStockItems] = await Promise.all([
    loadOrders(mine),
    Product.countDocuments(mine),
    Product.countDocuments({ ...mine, isActive: true }),
    Product.countDocuments({ ...mine, isActive: true, stock: 0 }),
    Product.countDocuments({ ...mine, isActive: true, stock: { $gt: 0, $lte: LOW_STOCK_LIMIT } }),
    Product.find({ ...mine, isActive: true, stock: { $lte: LOW_STOCK_LIMIT } })
      .sort("stock")
      .limit(5)
      .select("name stock images")
      .lean(),
  ]);

  const summary = summarizeOrders(orders, { timezone: getTimezone() });
  const recent = orders.slice(0, 5);
  const customers = await usersById(recent.map((order) => order.user), "name");

  respond(req, res, {
    shop: { name: req.user.name, shopName: req.user.shopName, approvalStatus: req.user.approvalStatus },
    products: {
      total,
      active,
      hidden: total - active,
      outOfStock,
      lowStock,
      lowStockLimit: LOW_STOCK_LIMIT,
      restockList: lowStockItems.map((product) => ({
        _id: product._id,
        name: product.name,
        stock: product.stock,
        image: product.images.length ? product.images[0].url : null,
      })),
    },
    orders: { ...summary.orders, needsAction: summary.orders.byStatus.pending },
    money: summary.money,
    unitsSold: summary.unitsSold,
    salesByDay: summary.salesByDay,
    salesByMonth: summary.salesByMonth,
    topProducts: topProducts(orders, 5),
    recentOrders: recent.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      itemCount: unitsIn(order),
      customer: customers.get(String(order.user))?.name || null,
      createdAt: order.createdAt,
    })),
  });
});

// GET /api/dashboard/admin  — the whole platform
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    customers,
    merchants,
    admins,
    inactive,
    newUsers,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalProducts,
    activeProducts,
    outOfStock,
    categories,
    orders,
    pendingMerchants,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "merchant" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: since } }),
    User.countDocuments({ role: "merchant", approvalStatus: "pending" }),
    User.countDocuments({ role: "merchant", approvalStatus: "approved" }),
    User.countDocuments({ role: "merchant", approvalStatus: "rejected" }),
    Product.countDocuments({}),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    Category.countDocuments({}),
    loadOrders({}),
    User.find({ role: "merchant", approvalStatus: "pending" })
      .sort("createdAt")
      .limit(5)
      .select("name email shopName createdAt")
      .lean(),
  ]);

  const summary = summarizeOrders(orders, { timezone: getTimezone() });
  const recent = orders.slice(0, 5);

  const perMerchant = new Map();
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    const key = String(order.merchant);
    const entry = perMerchant.get(key) || { merchantId: order.merchant, orders: 0, sales: 0 };
    entry.orders += 1;
    entry.sales += order.total;
    perMerchant.set(key, entry);
  }
  const best = [...perMerchant.values()].sort((a, b) => b.sales - a.sales).slice(0, 5);

  const people = await usersById(
    [...best.map((entry) => entry.merchantId), ...recent.flatMap((order) => [order.user, order.merchant])],
    "name shopName"
  );

  respond(req, res, {
    users: {
      customers,
      merchants,
      admins,
      inactive,
      newLast30Days: newUsers,
      merchantsByApproval: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
    },
    catalog: { products: totalProducts, activeProducts, outOfStock, categories },
    orders: summary.orders,
    money: summary.money,
    unitsSold: summary.unitsSold,
    salesByDay: summary.salesByDay,
    salesByMonth: summary.salesByMonth,
    topMerchants: best.map((entry) => ({
      merchantId: entry.merchantId,
      shopName: people.get(String(entry.merchantId))?.shopName || null,
      orders: entry.orders,
      sales: Math.round(entry.sales * 100) / 100,
    })),
    topProducts: topProducts(orders, 5),
    pendingMerchants, // waiting for approval: PATCH /api/admin/merchants/:id/status
    recentOrders: recent.map((order) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      itemCount: unitsIn(order),
      customer: people.get(String(order.user))?.name || null,
      shop: people.get(String(order.merchant))?.shopName || null,
      createdAt: order.createdAt,
    })),
  });
});

// GET /api/dashboard  — picks the right dashboard for the logged-in role
exports.getDashboard = (req, res, next) => {
  const handlers = { user: exports.getUserDashboard, merchant: exports.getMerchantDashboard, admin: exports.getAdminDashboard };
  return handlers[req.user.role](req, res, next);
};