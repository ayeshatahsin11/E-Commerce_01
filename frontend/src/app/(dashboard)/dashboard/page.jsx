"use client";

import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Package, Plus, Tags } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardHome() {
  const { user } = useAuth();
  const isAdmin = user.role === "admin";

  const cards = [
    {
      href: "/dashboard/products/new",
      icon: Plus,
      title: "Add a product",
      text: "Add a vegetable with price, unit, stock and photos.",
    },
    {
      href: "/dashboard/products",
      icon: Package,
      title: "My products",
      text: "Edit prices, update stock, hide or delete products.",
    },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/categories",
            icon: Tags,
            title: "Categories",
            text: "Create the categories customers shop by (Leafy, Roots...). Do this first.",
          },
          {
            href: "/dashboard/banners",
            icon: ImageIcon,
            title: "Home banners",
            text: "Upload the sliding banners shown at the top of the home page.",
          },
        ]
      : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Hello, {user.name.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-gray-500">
        {isAdmin ? "Manage your store from here." : `Manage the products of ${user.shopName || "your shop"}.`}
      </p>

      {isAdmin && (
        <p className="mt-4 rounded-xl bg-leaf-50 p-4 text-sm text-leaf-800">
          <strong>Getting started:</strong> 1) add categories, 2) add products, 3) add banners. Then open the
          store to see everything live.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 flex items-center gap-2 font-bold">
              {title}
              <ArrowRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
            </h2>
            <p className="mt-1 text-sm text-gray-500">{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}