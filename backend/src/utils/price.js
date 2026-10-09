const round2 = (number) => Math.round((number + Number.EPSILON) * 100) / 100;

// The price a customer actually pays: discountPrice if set, otherwise price
const unitPrice = (product) => (product.discountPrice != null ? product.discountPrice : product.price);

module.exports = { round2, unitPrice };