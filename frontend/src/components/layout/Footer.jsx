import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/shop?freshness=fresh_today", label: "Fresh today" },
      { href: "/shop?organic=true", label: "Organic" },
      { href: "/shop?featured=true", label: "Featured" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Login" },
      { href: "/register", label: "Create account" },
      { href: "/orders", label: "My orders" },
      { href: "/cart", label: "Cart" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-leaf-900 text-leaf-100">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold">{SITE.name}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-leaf-200">{SITE.description}</p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{column.title}</h3>
            <ul className="space-y-2.5 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-leaf-200 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">Contact</h3>
          <ul className="space-y-3 text-sm text-leaf-200">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {SITE.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {SITE.email}</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {SITE.address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-leaf-800 py-4 text-center text-xs text-leaf-300">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}