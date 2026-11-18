"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/dashboard/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <Link href="/dashboard/products" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-leaf-700">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Add a product</h1>
      <ProductForm />
    </div>
  );
}