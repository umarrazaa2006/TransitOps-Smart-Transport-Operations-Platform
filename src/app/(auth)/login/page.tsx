"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Truck, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";

const demoAccounts: Record<string, string> = {
  FLEET_MANAGER: "fleet@transitops.in",
  DISPATCHER: "dispatch@transitops.in",
  SAFETY_OFFICER: "safety@transitops.in",
  FINANCIAL_ANALYST: "finance@transitops.in",
  ADMIN: "admin@transitops.in",
};

const roleList = [
  { role: "FLEET_MANAGER", label: "Fleet Manager", scope: "Fleet, Maintenance" },
  { role: "DISPATCHER", label: "Dispatcher", scope: "Dashboard, Trips" },
  { role: "SAFETY_OFFICER", label: "Safety Officer", scope: "Drivers, Compliance" },
  { role: "FINANCIAL_ANALYST", label: "Financial Analyst", scope: "Fuel & Expenses, Analytics" },
];

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = React.useState("DISPATCHER");
  const [email, setEmail] = React.useState(demoAccounts.DISPATCHER);
  const [password, setPassword] = React.useState("password123");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function onRoleChange(value: string) {
    setRole(value);
    if (demoAccounts[value]) {
      setEmail(demoAccounts[value]);
      setPassword("password123");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Invalid credentials");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-card p-10 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TransitOps</h1>
              <p className="text-sm text-muted-foreground">Smart Transport Operations Platform</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <p className="text-lg font-semibold">One login, four roles</p>
          <ul className="space-y-3">
            {roleList.map((r) => (
              <li key={r.role} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.scope}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          TransitOps &copy; 2026 &middot; Role-based access
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">TransitOps</span>
          </div>
          <h2 className="text-xl font-semibold">Sign in to your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@transitops.in"
                  className="pl-9"
                  required
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="pl-9"
                  required
                />
              </div>
            </Field>
            <Field label="Role (demo quick-fill)">
              <Select value={role} onChange={(e) => onRoleChange(e.target.value)}>
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                <option value="ADMIN">Administrator</option>
              </Select>
            </Field>

            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo accounts</p>
            <p className="mt-1">
              Pick a role above to auto-fill. Password for all:{" "}
              <span className="font-mono text-foreground">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
