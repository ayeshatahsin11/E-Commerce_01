"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

// Loads data from the API:  const { data, loading, error, reload } = useApi("/products", { limit: 8 })
// Pass null as the path to skip the request (for example while waiting for another request).
export function useApi(path, query) {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const queryKey = JSON.stringify(query || {});
  const key = path ? `${path}?${queryKey}#${tick}` : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    api
      .get(path, JSON.parse(queryKey))
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, data: null, error: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [key, path, queryKey]);

  const reload = useCallback(() => setTick((value) => value + 1), []);

  const loading = key !== null && result.key !== key;
  const current = result.key === key ? result : { data: null, error: "" };

  return { data: current.data, error: current.error, loading, reload };
}