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