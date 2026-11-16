"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/ui/Loading";

// Usage: <ProtectedRoute roles={["user"]}> ...page... </ProtectedRoute>
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = Boolean(user) && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace("/");
  }, [loading, user, allowed, router, pathname]);

  if (loading || !allowed) return <PageLoader />;
  return children;
}