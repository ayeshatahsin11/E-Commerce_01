"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/dashboard/ProductForm";
import { PageLoader } from "@/components/ui/Loading";
import { useApi } from "@/lib/useApi";

export default function EditProductPage() {
  const { id } = useParams();
  // "my products" also contains hidden products, which the public endpoint may not return
  const { data, loading, error } = useApi("/products/my");
  const product = data?.products?.find((item) => item._id === id);

  return (
    <div>
      <Link href="/dashboard/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-leaf-700">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Edit product</h1>

      {loading ? (
        <PageLoader />
      ) : product ? (
        <ProductForm key={product._id} product={product} />
      ) : (
        <p className="card p-8 text-center text-gray-500">
          {error || "Product not found, or it belongs to another merchant."}
        </p>
      )}
    </div>
  );
}