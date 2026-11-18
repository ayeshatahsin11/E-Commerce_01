"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import Rating from "@/components/ui/Rating";
import { ProductCardSkeleton } from "@/components/ui/Loading";
import { useCart } from "@/context/CartContext";
import { discountPercent, effectivePrice, formatPrice, FRESHNESS_LABELS, formatQty } from "@/lib/format";

export default function ProductCard({ product }) {
  const { addItem, busy } = useCart();

  const unit = product.unit || "kg";
  const price = effectivePrice(product);
  const off = discountPercent(product);
  const soldOut = !(product.stock > 0);
  const minQty = product.minOrderQty || 1;
  const href = `/products/${product._id}`;

  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-leaf-50">
        <SmartImage
          src={product.images?.[0]?.url}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {off > 0 && (
            <span className="rounded-full bg-carrot-500 px-2.5 py-1 text-xs font-bold text-white">-{off}%</span>
          )}
          {product.isOrganic && (
            <span className="rounded-full bg-leaf-600 px-2.5 py-1 text-xs font-semibold text-white">Organic</span>
          )}
          {product.freshness === "fresh_today" && (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-leaf-700">
              {FRESHNESS_LABELS.fresh_today}
            </span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold text-gray-600">
            Out of stock
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="text-xs font-medium text-leaf-600">{product.category.name}</p>
        )}
        <Link href={href} className="mt-0.5 line-clamp-1 font-semibold hover:text-leaf-700">
          {product.name}
        </Link>

        <div className="mt-1 h-5">
          {product.numReviews > 0 && <Rating value={product.ratingsAverage} count={product.numReviews} />}
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-extrabold text-leaf-700">{formatPrice(price)}</span>
          <span className="text-xs text-gray-500">/ {unit}</span>
          {off > 0 && <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>}
        </div>

        <button
          type="button"
          disabled={soldOut || busy}
          onClick={() => addItem(product._id, minQty)}
          className="btn btn-primary mt-3 w-full"
        >
          <ShoppingBasket className="h-4 w-4" />
          {soldOut ? "Sold out" : `Add ${formatQty(minQty, unit)}`}
        </button>
      </div>
    </div>
  );
}

// A grid of product cards (or loading skeletons)
export function ProductGrid({ products, loading, skeletons = 8, columns = "md:grid-cols-3 xl:grid-cols-4" }) {
  const grid = `grid grid-cols-2 gap-3 sm:gap-5 ${columns}`;

  if (loading) {
    return (
      <div className={grid}>
        {Array.from({ length: skeletons }).map((_, n) => (
          <ProductCardSkeleton key={n} />
        ))}
      </div>
    );
  }

  return (
    <div className={grid}>
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}