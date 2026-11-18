"use client";

import Link from "next/link";
import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Loading";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { effectivePrice, formatPrice, formatQty } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function DashboardProductsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/products/my");
  const products = data?.products || [];

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      toast.success("Product deleted");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Products</h1>
          <p className="mt-1 text-gray-500">{loading ? "Loading..." : `${products.length} products`}</p>
        </div>
        <Link href="/dashboard/products/new" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          [1, 2, 3].map((n) => <Skeleton key={n} className="h-24" />)
        ) : products.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-4xl">🥕</p>
            <p className="mt-3 font-semibold">No products yet</p>
            <p className="mt-1 text-sm text-gray-500">Add your first product so customers can see it in the store.</p>
            <Link href="/dashboard/products/new" className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="card flex flex-wrap items-center gap-4 p-3 sm:p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-leaf-50">
                <SmartImage src={product.images?.[0]?.url} alt={product.name} className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1 basis-48">
                <Link href={`/products/${product._id}`} className="line-clamp-1 font-semibold hover:text-leaf-700">
                  {product.name}
                </Link>
                <p className="text-sm text-gray-500">{product.category?.name || "No category"}</p>
                {product.isActive === false && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    <EyeOff className="h-3 w-3" /> Hidden
                  </span>
                )}
              </div>

              <div className="text-sm">
                <p className="font-bold text-leaf-700">
                  {formatPrice(effectivePrice(product))} <span className="font-normal text-gray-500">/ {product.unit || "kg"}</span>
                </p>
                <p className={product.stock > 0 ? "text-gray-500" : "font-semibold text-red-600"}>
                  {product.stock > 0 ? `${formatQty(product.stock, product.unit)} in stock` : "Out of stock"}
                </p>
              </div>

              <div className="ml-auto flex gap-1">
                <Link
                  href={`/dashboard/products/${product._id}/edit`}
                  aria-label={`Edit ${product.name}`}
                  className="rounded-full p-2.5 text-gray-500 hover:bg-leaf-50 hover:text-leaf-700"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => remove(product)}
                  aria-label={`Delete ${product.name}`}
                  className="rounded-full p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}