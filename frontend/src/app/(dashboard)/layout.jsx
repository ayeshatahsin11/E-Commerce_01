"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Clock,
  ExternalLink,
  Image as ImageIcon,
  LayoutDashboard,
  Leaf,
  LogOut,
  Package,
  Tags,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { SITE } from "@/lib/site";

function Shell({ children }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = user.role === "admin";
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/products", label: "Products", icon: Package },
    ...(isAdmin
      ? [
          { href: "/dashboard/categories", label: "Categories", icon: Tags },
          { href: "/dashboard/banners", label: "Banners", icon: ImageIcon },
        ]
      : []),
  ];

  const isActive = (link) => (link.exact ? pathname === link.href : pathname.startsWith(link.href));

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out");
    router.push("/");
  };

  const pending = user.role === "merchant" && user.approvalStatus !== "approved";

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-leaf-100 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block md:p-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-leaf-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600 text-white">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="font-extrabold">{SITE.name}</span>
          </Link>
          <span className="rounded-full bg-leaf-100 px-2.5 py-1 text-xs font-semibold capitalize text-leaf-700 md:mt-3 md:inline-block">
            {user.role}
          </span>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                  isActive(link) ? "bg-leaf-600 text-white" : "text-gray-600 hover:bg-leaf-50"
                }`}
              >
                <Icon className="h-4 w-4" /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden space-y-1 border-t border-leaf-100 p-3 md:block">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 hover:bg-leaf-50">
            <ExternalLink className="h-4 w-4" /> View store
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
          <p className="truncate px-3.5 pt-2 text-xs text-gray-400">{user.name}</p>
        </div>
      </aside>

      <div className="min-w-0 flex-1 bg-cream">
        <div className="flex items-center justify-between gap-3 border-b border-leaf-100 bg-white px-4 py-2 text-sm md:hidden">
          <Link href="/" className="font-semibold text-leaf-700">View store</Link>
          <button type="button" onClick={handleLogout} className="font-semibold text-red-600">Logout</button>
        </div>

        <div className="mx-auto max-w-6xl p-4 sm:p-8">
          {pending && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <Clock className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Your merchant account is <strong>{user.approvalStatus}</strong>. An admin must approve it
                before you can add products.
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

// Only merchants and admins can open anything inside /dashboard
export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute roles={["merchant", "admin"]}>
      <Shell>{children}</Shell>
    </ProtectedRoute>
  );
}