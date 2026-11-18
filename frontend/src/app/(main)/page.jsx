"use client";

import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, Truck, Wallet } from "lucide-react";
import BannerCarousel, { DefaultHero } from "@/components/home/BannerCarousel";
import { ProductGrid } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/Loading";
import { useApi } from "@/lib/useApi";
import { categoryEmoji, formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

const PERKS = [
  { icon: Leaf, title: "Farm fresh", text: "Picked every morning" },
  { icon: Truck, title: "Fast delivery", text: "At your door, same day" },
  { icon: ShieldCheck, title: "Quality promise", text: "Not fresh? We replace it" },
  { icon: Wallet, title: "Pay on delivery", text: "Cash when you receive" },
];

// One row of products. It hides itself when there is nothing to show.
function ProductSection({ title, subtitle, href, result, count = 4 }) {
  const products = result.data?.products || [];
  if (!result.loading && products.length === 0) return null;

  return (
    <section className="container-page py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-leaf-700 hover:underline">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <ProductGrid products={products} loading={result.loading} skeletons={count} />
    </section>
  );
}

export default function HomePage() {
  const banners = useApi("/banners");
  const categories = useApi("/categories");
  const featured = useApi("/products", { featured: "true", limit: 4 });
  const fresh = useApi("/products", { freshness: "fresh_today", limit: 4 });
  const latest = useApi("/products", { sort: "newest", limit: 8 });

  const bannerList = banners.data?.banners || [];
  const categoryList = categories.data?.categories || [];

  return (
    <div>
      <section className="container-page pt-5 sm:pt-6">
        {banners.loading ? (
          <Skeleton className="aspect-[16/11] rounded-3xl sm:aspect-[21/8]" />
        ) : bannerList.length > 0 ? (
          <BannerCarousel banners={bannerList} />
        ) : (
          <DefaultHero />
        )}
      </section>

      <section className="container-page py-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex items-center gap-3 p-3.5 sm:p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="truncate text-xs text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {(categories.loading || categoryList.length > 0) && (
        <section className="container-page py-4">
          <h2 className="mb-5 text-2xl font-bold">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.loading
              ? [1, 2, 3, 4, 5, 6].map((n) => <Skeleton key={n} className="h-28" />)
              : categoryList.map((category) => (
                  <Link
                    key={category._id}
                    href={`/shop?category=${category._id}`}
                    className="card flex flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-0.5 hover:border-leaf-300 hover:shadow-md"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-50 text-3xl">
                      {categoryEmoji(category.name)}
                    </span>
                    <span className="line-clamp-1 text-sm font-semibold">{category.name}</span>
                  </Link>
                ))}
          </div>
        </section>
      )}

      <ProductSection title="Featured picks" subtitle="Hand-picked by our team" href="/shop?featured=true" result={featured} />
      <ProductSection title="Fresh today" subtitle="Harvested this morning" href="/shop?freshness=fresh_today" result={fresh} />
      <ProductSection title="New arrivals" subtitle="Just added to the store" href="/shop" result={latest} count={8} />

      <section className="container-page py-10">
        <div className="relative overflow-hidden rounded-3xl bg-leaf-800 px-6 py-10 text-white sm:px-12">
          <span className="absolute -right-4 -top-6 text-[9rem] opacity-15">🥕</span>
          <h2 className="relative text-2xl font-extrabold sm:text-3xl">
            Free delivery on orders over {formatPrice(SITE.freeDeliveryAbove)}
          </h2>
          <p className="relative mt-2 max-w-lg text-leaf-100">
            Fill your basket with fresh vegetables and we bring them to your door.
          </p>
          <Link href="/shop" className="btn relative mt-5 bg-white text-leaf-800 hover:bg-leaf-50">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}