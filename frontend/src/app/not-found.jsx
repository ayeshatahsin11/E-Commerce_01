import Link from "next/link";
import { Leaf } from "lucide-react";
import { SITE } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-600 text-white">
        <Leaf className="h-7 w-7" />
      </span>
      <p className="mt-6 text-6xl font-extrabold text-leaf-600">404</p>
      <h1 className="mt-3 text-2xl font-bold">This page is not here yet</h1>
      <p className="mt-2 max-w-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to {SITE.name}
      </Link>
    </div>
  );
}