"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { safeNext } from "@/lib/format";
import { SITE } from "@/lib/site";

const SHAPE = "aspect-[16/11] sm:aspect-[21/8]";

// Shown when the admin has not added any banner yet
export function DefaultHero() {
  return (
    <div
      className={`relative flex ${SHAPE} items-center overflow-hidden rounded-3xl bg-gradient-to-br from-leaf-600 via-leaf-500 to-leaf-400`}
    >
      <span className="absolute -right-6 -top-6 text-[9rem] opacity-20 sm:text-[14rem]">🥬</span>
      <span className="absolute bottom-0 right-1/4 hidden text-8xl opacity-20 sm:block">🥕</span>
      <div className="relative max-w-xl p-6 text-white sm:p-12">
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">100% fresh, every day</span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">{SITE.tagline}</h1>
        <p className="mt-3 hidden max-w-md text-leaf-50 sm:block">{SITE.description}</p>
        <Link href="/shop" className="btn mt-5 bg-white text-leaf-800 hover:bg-leaf-50">
          Shop now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function BannerCarousel({ banners }) {
  const count = banners.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = index % count;

  // slide automatically every 5 seconds (stops while the mouse is on the banner)
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count, paused]);

  const go = (next) => setIndex((next + count) % count);

  return (
    <div
      className={`relative ${SHAPE} overflow-hidden rounded-3xl bg-leaf-100`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((banner, n) => (
        <div
          key={banner._id}
          aria-hidden={n !== current}
          className={`absolute inset-0 transition-opacity duration-700 ${
            n === current ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <SmartImage src={banner.image?.url} alt={banner.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl p-6 text-white sm:p-12">
              <h2 className="text-2xl font-extrabold leading-tight sm:text-5xl">{banner.title}</h2>
              {banner.subtitle && (
                <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/90 sm:mt-3 sm:text-base">
                  {banner.subtitle}
                </p>
              )}
              <Link
                href={safeNext(banner.link) || "/shop"}
                tabIndex={n === current ? 0 : -1}
                className="btn mt-4 bg-white text-leaf-800 hover:bg-leaf-50 sm:mt-6"
              >
                {banner.buttonText || "Shop now"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-leaf-800 shadow hover:bg-white sm:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-leaf-800 shadow hover:bg-white sm:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((banner, n) => (
              <button
                key={banner._id}
                type="button"
                onClick={() => go(n)}
                aria-label={`Go to banner ${n + 1}`}
                className={`h-2 rounded-full transition-all ${
                  n === current ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}