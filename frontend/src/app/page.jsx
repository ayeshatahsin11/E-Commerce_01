"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, Truck } from "lucide-react";
import { api } from "@/lib/api";
import { SITE } from "@/lib/site";
import { Skeleton } from "@/components/ui/Loading";

const PERKS = [
  { icon: Leaf, title: "Farm fresh", text: "Picked every morning" },
  { icon: Truck, title: "Fast delivery", text: "At your door, same day" },
  { icon: ShieldCheck, title: "Quality promise", text: "Not fresh? We replace it" },
];

export default function HomePage() {
  const [categories, setCategories] = useState(null); // null = still loading
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/categories")
      .then((data) => setCategories(data.categories))
      .catch((err) => {
        setError(err.message);
        setCategories([]);
      });
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-leaf-100 via-cream to-carrot-50">
        <div className="container-page grid items-center gap-8 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-leaf-700 shadow-sm">
              100% fresh, every day
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-leaf-900 md:text-5xl">
              Fresh from the farm to your kitchen
            </h1>
            <p className="mt-4 max-w-md text-gray-600">{SITE.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary">
                Shop now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?organic=true" className="btn btn-outline">
                Organic picks
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {PERKS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card flex items-center gap-4 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-gray-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-5 text-2xl font-bold">Shop by category</h2>

        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            Could not load categories: {error}
          </p>
        )}

        {categories === null ? (
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-11 w-32 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/shop?category=${category._id}`}
                className="rounded-full border border-leaf-200 bg-white px-5 py-2.5 text-sm font-medium hover:border-leaf-500 hover:bg-leaf-50"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}