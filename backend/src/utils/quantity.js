const EPS = 1e-9;

const round3 = (number) => Math.round((number + Number.EPSILON) * 1000) / 1000;

// 1.5 is a multiple of 0.5 -> true
const isMultipleOf = (value, step) => {
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-6;
};

// Enough stock? (tolerates tiny decimal errors like 0.30000000000000004)
const hasStock = (stock, quantity) => stock + EPS >= quantity;

// Checks a quantity against the product's minOrderQty and step. Returns { value } or { error }
const checkQuantity = (product, raw) => {
  const quantity = round3(Number(raw));
  const unit = product.unit || "";
  const min = product.minOrderQty ?? 1;
  const step = product.step ?? 1;

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Quantity must be a number greater than 0" };
  }
  if (quantity + EPS < min) {
    return { error: `Minimum order is ${min} ${unit}`.trim() };
  }
  if (!isMultipleOf(quantity, step)) {
    return { error: `Quantity must be in steps of ${step} ${unit}`.trim() };
  }
  return { value: quantity };
};

module.exports = { EPS, round3, isMultipleOf, hasStock, checkQuantity };