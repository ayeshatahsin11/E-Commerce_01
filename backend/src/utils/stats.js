const { round2 } = require("./price");

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const LOW_STOCK_LIMIT = 5;

// Set APP_TIMEZONE in .env (e.g. Asia/Dhaka) so "today" and "this month" follow your local time
const getTimezone = () => {
  const timezone = process.env.APP_TIMEZONE || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return timezone;
  } catch (error) {
    return "UTC";
  }
};

// "2026-10-02" for a moment in time, as seen in the given timezone
const dayKey = (date, timezone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
};

// ["2026-09-03", ..., "2026-10-02"]  (oldest first, ends with today)
const lastNDays = (count, todayKey) => {
  const [year, month, day] = todayKey.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(year, month - 1, day - (count - 1 - i))).toISOString().slice(0, 10)
  );
};

// ["2026-05", ..., "2026-10"]  (oldest first, ends with this month)
const lastNMonths = (count, todayKey) => {
  const [year, month] = todayKey.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1)).toISOString().slice(0, 7)
  );
};

// Words used below:
//   sales   = value of all orders that are not cancelled
//   revenue = value of delivered orders (money actually collected)
const summarizeOrders = (orders, { timezone, now = new Date(), days = 30, months = 6 }) => {
  const today = dayKey(now, timezone);
  const thisMonth = today.slice(0, 7);

  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  const dayBuckets = new Map(lastNDays(days, today).map((date) => [date, { date, orders: 0, sales: 0 }]));
  const monthBuckets = new Map(lastNMonths(months, today).map((month) => [month, { month, orders: 0, sales: 0 }]));

  let sales = 0;
  let revenue = 0;
  let todaySales = 0;
  let thisMonthSales = 0;
  let countedOrders = 0;
  let unitsSold = 0;

  for (const order of orders) {
    byStatus[order.status] += 1;
    if (order.status === "cancelled") continue;

    countedOrders += 1;
    sales += order.total;
    if (order.status === "delivered") revenue += order.total;
    for (const item of order.items) unitsSold += item.quantity;

    const key = dayKey(order.createdAt, timezone);
    if (key === today) todaySales += order.total;
    if (key.startsWith(thisMonth)) thisMonthSales += order.total;

    const day = dayBuckets.get(key);
    if (day) {
      day.orders += 1;
      day.sales += order.total;
    }
    const month = monthBuckets.get(key.slice(0, 7));
    if (month) {
      month.orders += 1;
      month.sales += order.total;
    }
  }

  const clean = (bucket) => ({ ...bucket, sales: round2(bucket.sales) });

  return {
    orders: {
      total: orders.length,
      byStatus,
      active: byStatus.pending + byStatus.confirmed + byStatus.shipped,
    },
    money: {
      sales: round2(sales),
      revenue: round2(revenue),
      outstanding: round2(sales - revenue),
      todaySales: round2(todaySales),
      thisMonthSales: round2(thisMonthSales),
      averageOrderValue: countedOrders ? round2(sales / countedOrders) : 0,
    },
    unitsSold,
    salesByDay: [...dayBuckets.values()].map(clean),
    salesByMonth: [...monthBuckets.values()].map(clean),
  };
};

// Best sellers (cancelled orders are ignored)
const topProducts = (orders, limit = 5) => {
  const totals = new Map();

  for (const order of orders) {
    if (order.status === "cancelled") continue;
    for (const item of order.items) {
      const key = String(item.product);
      const entry = totals.get(key) || {
        productId: item.product,
        name: item.name,
        image: item.image || null,
        units: 0,
        revenue: 0,
      };
      entry.units += item.quantity;
      entry.revenue += item.price * item.quantity;
      totals.set(key, entry);
    }
  }

  return [...totals.values()]
    .map((entry) => ({ ...entry, revenue: round2(entry.revenue) }))
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit);
};

module.exports = { STATUSES, LOW_STOCK_LIMIT, getTimezone, dayKey, lastNDays, lastNMonths, summarizeOrders, topProducts };