import { Leaf } from "lucide-react";

// The white form card used by the login and register pages
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="card w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
          <Leaf className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
      {children}
      <p className="mt-6 text-center text-sm text-gray-600">{footer}</p>
    </div>
  );
}