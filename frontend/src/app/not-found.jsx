import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-leaf-600">404</p>
      <h1 className="mt-3 text-2xl font-bold">This page is not here yet</h1>
      <p className="mt-2 max-w-sm text-gray-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}

