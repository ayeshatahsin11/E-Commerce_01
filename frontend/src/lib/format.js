export const formatPrice = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const UNIT_LABELS = {
  kg: "kg",
  g: "g",
  piece: "pc",
  dozen: "dozen",
  bunch: "bunch",
  litre: "L",
};

export const formatQty = (quantity, unit) =>
  `${Number(quantity)} ${UNIT_LABELS[unit] || unit || ""}`.trim();

// Only allow redirects inside our own site (blocks "//evil.com" style links)
export const safeNext = (next) =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : null;

// 0.1 + 0.2 style decimal errors: keep 3 decimals
export const round3 = (number) => Math.round((Number(number) + Number.EPSILON) * 1000) / 1000;

const hasDiscount = (product) =>
  product.discountPrice != null && product.discountPrice < product.price;

// the price the customer really pays (per unit)
export const effectivePrice = (product) => (hasDiscount(product) ? product.discountPrice : product.price);

export const discountPercent = (product) =>
  hasDiscount(product) ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

export const FRESHNESS_LABELS = {
  none: "",
  fresh_today: "Fresh today",
  seasonal: "Seasonal",
};

// A friendly emoji for a category name (used instead of category images)
const EMOJI_RULES = [
  [/leaf|green|spinach|lettuce|salad/, "🥬"],
  [/root|carrot/, "🥕"],
  [/fruit/, "🍎"],
  [/herb/, "🌿"],
  [/tomato/, "🍅"],
  [/potato/, "🥔"],
  [/onion|garlic/, "🧅"],
  [/chili|chilli|pepper/, "🌶️"],
  [/mushroom/, "🍄"],
  [/organic/, "🌱"],
  [/gourd|pumpkin|squash/, "🎃"],
  [/corn/, "🌽"],
  [/brinjal|eggplant/, "🍆"],
  [/cucumber/, "🥒"],
  [/bean|pea/, "🫛"],
  [/broccoli|cauliflower|cabbage/, "🥦"],
];

export const categoryEmoji = (name = "") => {
  const text = name.toLowerCase();
  const hit = EMOJI_RULES.find(([pattern]) => pattern.test(text));
  return hit ? hit[1] : "🥬";
};