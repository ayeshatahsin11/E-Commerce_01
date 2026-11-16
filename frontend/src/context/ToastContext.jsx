"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { box: "border-leaf-200 bg-white text-ink", icon: CheckCircle2, color: "text-leaf-600" },
  error: { box: "border-red-200 bg-white text-ink", icon: AlertCircle, color: "text-red-500" },
  info: { box: "border-carrot-500/30 bg-white text-ink", icon: Info, color: "text-carrot-600" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++idRef.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((toast) => {
          const style = STYLES[toast.type];
          const Icon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-lg ${style.box}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.color}`} />
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                aria-label="Dismiss"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);