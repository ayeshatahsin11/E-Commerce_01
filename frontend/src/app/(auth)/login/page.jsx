"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import { Spinner } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { safeNext } from "@/lib/format";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Already logged in (or just logged in): go to ?next= or the right home page
  useEffect(() => {
    if (!loading && user) {
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      const home = user.role === "user" ? "/" : "/dashboard";
      router.replace(next || home);
    }
  }, [loading, user, router]);

  const update = (event) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${loggedIn.name.split(" ")[0]}!`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to continue shopping"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-leaf-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={update}
              placeholder="Your password"
              className="input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary w-full">
          {submitting ? <Spinner className="h-4 w-4" /> : "Log in"}
        </button>
      </form>
    </AuthCard>
  );
}