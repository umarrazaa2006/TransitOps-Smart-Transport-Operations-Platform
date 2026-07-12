"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSearch } from "./search-context";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/utils";

export function Topbar({
  user,
  onMenu,
}: {
  user: { name: string; email: string; role: string };
  onMenu: () => void;
}) {
  const router = useRouter();
  const { query, setQuery } = useSearch();
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this page..."
          className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <div className="hidden items-center gap-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials(user.name)}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          disabled={loggingOut}
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
