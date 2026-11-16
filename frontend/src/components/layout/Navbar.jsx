"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  Leaf,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBasket,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?freshness=fresh_today", label: "Fresh Today" },
  { href: "/shop?organic=true", label: "Organic" },
];

function SearchBox({ className = "", onDone }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?search=${encodeURIComponent(term)}` : "/shop");
    onDone?.();
  };

  return (
    <form onSubmit={submit} role="search" className={`relative ${className}`}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search vegetables, fruits, herbs..."
        aria-label="Search products"
        className="input pr-12"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-leaf-600 p-2 text-white hover:bg-leaf-700"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { cart } = useCart();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // A menu is "open" only for the page it was opened on, so it closes by itself when you navigate
  const [userMenuPath, setUserMenuPath] = useState(null);
  const [mobilePath, setMobilePath] = useState(null);
  const userOpen = userMenuPath === pathname;
  const mobileOpen = mobilePath === pathname;
  const menuRef = useRef(null);

  useEffect(() => {
    const onMouseDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setUserMenuPath(null);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out");
    router.push("/");
  };

  const showCart = !user || user.role === "user";
  const menuLinks =
    user?.role === "user"
      ? [
          { href: "/orders", label: "My Orders", icon: Package },
          { href: "/wishlist", label: "Wishlist", icon: Heart },
          { href: "/profile", label: "Profile", icon: User },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/profile", label: "Profile", icon: User },
        ];

  return (
    <header className="sticky top-0 z-40 border-b border-leaf-100 bg-white/90 backdrop-blur">
      <div className="bg-leaf-700 px-4 py-1.5 text-center text-xs text-white">
        Free delivery on orders over {formatPrice(SITE.freeDeliveryAbove)} · Picked fresh every morning
      </div>

      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-leaf-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">{SITE.name}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium hover:bg-leaf-50 hover:text-leaf-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <SearchBox className="mx-auto hidden max-w-md flex-1 md:block" />

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {showCart && (
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative rounded-full p-2.5 hover:bg-leaf-50"
            >
              <ShoppingBasket className="h-6 w-6" />
              {cart.itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-carrot-500 px-1 text-[11px] font-bold text-white">
                  {cart.itemCount}
                </span>
              )}
            </Link>
          )}

          {loading ? (
            <span className="ml-2 h-9 w-20 animate-pulse rounded-full bg-leaf-100" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserMenuPath(userOpen ? null : pathname)}
                aria-expanded={userOpen}
                className="ml-1 flex items-center gap-2 rounded-full border border-leaf-200 py-1.5 pl-1.5 pr-3 hover:bg-leaf-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-leaf-600 text-sm font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate text-sm font-medium sm:block">
                  {user.name?.split(" ")[0]}
                </span>
              </button>

              {userOpen && (
                <div className="card absolute right-0 mt-2 w-56 overflow-hidden p-1.5 shadow-lg">
                  <div className="border-b border-leaf-100 px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs capitalize text-gray-500">{user.role}</p>
                  </div>
                  {menuLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-leaf-50"
                    >
                      <Icon className="h-4 w-4 text-leaf-600" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ml-1 flex items-center gap-1">
              <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary">
                Sign up
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobilePath(mobileOpen ? null : pathname)}
            aria-label="Menu"
            aria-expanded={mobileOpen}
            className="rounded-full p-2.5 hover:bg-leaf-50 lg:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-leaf-100 bg-white lg:hidden">
          <div className="container-page space-y-3 py-4">
            <SearchBox className="md:hidden" onDone={() => setMobilePath(null)} />
            <nav className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-leaf-50"
                >
                  {link.label}
                </Link>
              ))}
              {!user && !loading && (
                <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-leaf-50">
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}