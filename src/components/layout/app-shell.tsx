"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Truck, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { SearchProvider } from "./search-context";
import { UserProvider, type CurrentUser } from "./user-context";

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Truck className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold leading-tight">TransitOps</p>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Transport Ops</p>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <UserProvider user={user}>
      <SearchProvider>
        <div className="flex min-h-screen">
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-card md:flex">
            <Brand />
            <div className="scrollbar-thin flex-1 overflow-y-auto">
              <Sidebar role={user.role} />
            </div>
            <div className="border-t px-5 py-3 text-[11px] text-muted-foreground">
              TransitOps &copy; 2026
            </div>
          </aside>

          {mobileOpen ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
              <aside className="absolute inset-y-0 left-0 flex w-64 animate-fade-in flex-col border-r bg-card">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <span className="text-sm font-bold">TransitOps</span>
                  <button onClick={() => setMobileOpen(false)} aria-label="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="scrollbar-thin flex-1 overflow-y-auto">
                  <Sidebar role={user.role} onNavigate={() => setMobileOpen(false)} />
                </div>
              </aside>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col md:pl-64">
            <Topbar user={user} onMenu={() => setMobileOpen(true)} />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </SearchProvider>
    </UserProvider>
  );
}
