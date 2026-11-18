import Link from "next/link";
import { ArrowLeft, Leaf, ShieldCheck, Truck } from "lucide-react";
import { SITE } from "@/lib/site";

// Login / register: no Navbar, no Footer, just a clean two-column screen
export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-leaf-800 via-leaf-700 to-leaf-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="absolute -bottom-10 -right-6 text-[16rem] leading-none opacity-15">🥬</span>
        <span className="absolute right-24 top-24 text-8xl opacity-15">🥕</span>
        <span className="absolute left-10 top-1/2 text-7xl opacity-10">🍅</span>

        <Link href="/" className="relative flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold">{SITE.name}</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight">Fresh from the farm to your kitchen</h2>
          <p className="mt-4 text-leaf-100">{SITE.description}</p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-leaf-200" /> Same-day delivery to your door
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-leaf-200" /> Not fresh? We replace it, no questions asked
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-leaf-200">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </aside>

      <div className="flex flex-col bg-cream">
        <div className="p-4 sm:p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-leaf-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to store
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-6">{children}</div>
      </div>
    </div>
  );
}