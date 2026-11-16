"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

// /auth/me returns "_id", login returns "id": make it always "id"
const normalize = (user) => (user ? { ...user, id: user.id || user._id } : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until we know if someone is logged in

  const refresh = useCallback(async () => {
    try {
      const data = await api.get("/auth/me");
      const current = normalize(data.user);
      setUser(current);
      return current;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      const data = await api.post("/auth/login", { email, password });
      return (await refresh()) || normalize(data.user);
    },
    [refresh]
  );

  const register = useCallback(
    async (details) => {
      const data = await api.post("/auth/register", details);
      return (await refresh()) || normalize(data.user);
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (fields) => {
    const data = await api.put("/auth/profile", fields);
    setUser(normalize(data.user));
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, updateProfile }),
    [user, loading, login, register, logout, refresh, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);