"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info";
type ToastItem = { id: number; title: string; description?: string; variant: Variant };
type ToastInput = { title: string; description?: string; variant?: Variant };

const ToastContext = React.createContext<{ toast: (t: ToastInput) => void } | null>(null);

const iconFor: Record<Variant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-rose-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: ToastInput) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const item: ToastItem = {
        id,
        title: t.title,
        description: t.description,
        variant: t.variant ?? "info",
      };
      setItems((prev) => [...prev, item]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              "pointer-events-auto flex animate-fade-in items-start gap-3 rounded-lg border bg-card p-4 shadow-lg"
            )}
          >
            <div className="mt-0.5">{iconFor[it.variant]}</div>
            <div className="flex-1">
              <p className="text-sm font-medium">{it.title}</p>
              {it.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{it.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(it.id)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
