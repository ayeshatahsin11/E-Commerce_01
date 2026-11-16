"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShoppingBasket, Store } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import { Spinner } from "@/components/ui/Loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { safeNext } from "@/lib/format";

const ROLES = [
  { value: "user", label: "Customer", icon: ShoppingBasket },
  { value: "merchant", label: "Merchant", icon: Store },
];

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [role, setRole] = useState("user");
  const [form, setForm] = useState({ name: "", email: "", password: "", shopName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(next || "/");
    }
  }, [loading, user, router]);

  const update = (event) => setForm((f) => ({ ...f, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        shopName: role === "merchant" ? form.shopName.trim() : undefined,
      });
      toast.success(
        role === "merchant"
          ? "Account created! Your shop will be reviewed by an admin before you can sell."
          : "Account created. Welcome!"
      );
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join us for the freshest vegetables in town"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-leaf-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-leaf-50 p-1">
          {ROLES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              aria-pressed={role === value}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                role === value ? "bg-white text-leaf-700 shadow-sm" : "text-gray-500 hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" name="name" required autoComplete="name" value={form.name} onChange={update} className="input" />
        </div>

        {role === "merchant" && (
          <div>
            <label htmlFor="shopName" className="label">Shop name</label>
            <input id="shopName" name="shopName" required value={form.shopName} onChange={update} className="input" />
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={update} className="input" />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={update}
              placeholder="At least 8 characters"
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
          {submitting ? <Spinner className="h-4 w-4" /> : "Create account"}
        </button>
      </form>
    </AuthCard>
  );
}