"use client";

import * as React from "react";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route,
  Clock3,
  Users,
  Gauge,
  CircleDashed,
} from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/use-api";
import { VEHICLE_TYPES, VEHICLE_STATUSES, REGIONS } from "@/lib/constants";

interface DashboardData {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
    totalVehicles: number;
  };
  vehicleStatus: Record<string, number>;
  recentTrips: {
    id: string;
    tripCode: string;
    source: string;
    destination: string;
    status: string;
    vehicle: { name: string } | null;
    driver: { name: string } | null;
  }[];
}

const statusBarColor: Record<string, string> = {
  Available: "bg-emerald-500",
  "On Trip": "bg-sky-500",
  "In Shop": "bg-amber-500",
  Retired: "bg-rose-500",
};

export default function DashboardPage() {
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [region, setRegion] = React.useState("");

  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  if (region) params.set("region", region);
  const { data, loading } = useApi<DashboardData>("/api/dashboard?" + params.toString());

  const kpis = data?.kpis;
  const totalForBars = data ? Object.values(data.vehicleStatus).reduce((s, n) => s + n, 0) : 0;

  return (
    <div>
      <PageHeader title="Dashboard" description="Live operational overview of your fleet.">
        <div className="w-36">
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Vehicle type">
            <option value="">All types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All status</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      </PageHeader>

      {loading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
            <StatCard
              label="Active Vehicles"
              value={kpis?.activeVehicles ?? 0}
              accent="primary"
              icon={<Truck className="h-5 w-5" />}
            />
            <StatCard
              label="Available"
              value={kpis?.availableVehicles ?? 0}
              accent="green"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              label="In Maintenance"
              value={kpis?.inMaintenance ?? 0}
              accent="amber"
              icon={<Wrench className="h-5 w-5" />}
            />
            <StatCard
              label="Active Trips"
              value={kpis?.activeTrips ?? 0}
              accent="blue"
              icon={<Route className="h-5 w-5" />}
            />
            <StatCard
              label="Pending Trips"
              value={kpis?.pendingTrips ?? 0}
              accent="violet"
              icon={<Clock3 className="h-5 w-5" />}
            />
            <StatCard
              label="Drivers On Duty"
              value={kpis?.driversOnDuty ?? 0}
              accent="green"
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Fleet Utilization"
              value={(kpis?.fleetUtilization ?? 0) + "%"}
              accent="primary"
              icon={<Gauge className="h-5 w-5" />}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recent Trips</CardTitle>
                <Link href="/trips" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              </CardHeader>
              <CardContent>
                {data && data.recentTrips.length > 0 ? (
                  <div className="space-y-1">
                    {data.recentTrips.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            <span className="text-muted-foreground">{t.tripCode}</span> {t.source}{" "}
                            &rarr; {t.destination}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {t.vehicle?.name ?? "Unassigned"} &middot;{" "}
                            {t.driver?.name ?? "No driver"}
                          </p>
                        </div>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No trips yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {VEHICLE_STATUSES.map((s) => {
                  const count = data?.vehicleStatus[s] ?? 0;
                  const pct = totalForBars > 0 ? Math.round((count / totalForBars) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" /> {s}
                        </span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={statusBarColor[s] + " h-full rounded-full transition-all"}
                          style={{ width: pct + "%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
