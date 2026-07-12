"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Gauge, TrendingUp, Wallet, Percent, Download, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useApi } from "@/hooks/use-api";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

interface PerVehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  fuelCost: number;
  maintenanceCost: number;
  operationalCost: number;
  revenue: number;
  distance: number;
  roi: number;
  efficiency: number;
}
interface AnalyticsData {
  summary: {
    fuelEfficiency: number;
    fleetUtilization: number;
    operationalCost: number;
    roi: number;
    revenue: number;
    otherExpenses: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  costliestVehicles: { name: string; operationalCost: number }[];
  perVehicle: PerVehicle[];
}

export default function AnalyticsPage() {
  const { data, loading } = useApi<AnalyticsData>("/api/analytics");

  function exportCsv() {
    const a = document.createElement("a");
    a.href = "/api/analytics?format=csv";
    a.download = "transitops-report.csv";
    a.click();
  }

  const maxCost = Math.max(1, ...(data?.costliestVehicles ?? []).map((v) => v.operationalCost));

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Operational efficiency, cost and profitability insights."
      >
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      {loading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Fuel Efficiency"
              value={(data?.summary.fuelEfficiency ?? 0).toFixed(1) + " km/l"}
              accent="blue"
              icon={<Gauge className="h-5 w-5" />}
            />
            <StatCard
              label="Fleet Utilization"
              value={(data?.summary.fleetUtilization ?? 0) + "%"}
              accent="green"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label="Operational Cost"
              value={formatCurrency(data?.summary.operationalCost ?? 0)}
              accent="amber"
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              label="Vehicle ROI"
              value={(data?.summary.roi ?? 0).toFixed(1) + "%"}
              accent="primary"
              icon={<Percent className="h-5 w-5" />}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.monthlyRevenue ?? []}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                        tickFormatter={(v) => formatCurrency(Number(v))}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
                        contentStyle={{
                          background: "hsl(222 22% 8%)",
                          border: "1px solid #3f3f46",
                          borderRadius: 8,
                          color: "#fff",
                        }}
                        cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Costliest Vehicles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(data?.costliestVehicles ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No cost data yet</p>
                ) : (
                  data?.costliestVehicles.map((v, i) => (
                    <div key={v.name}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{v.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatCurrency(v.operationalCost)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            i === 0 ? "bg-rose-500" : i === 1 ? "bg-amber-500" : "bg-sky-500"
                          )}
                          style={{ width: Math.round((v.operationalCost / maxCost) * 100) + "%" }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Per-Vehicle Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Fuel</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Operational</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.perVehicle.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {v.name}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {v.registrationNumber}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(v.fuelCost)}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(v.maintenanceCost)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(v.operationalCost)}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(v.revenue)}</TableCell>
                      <TableCell className="tabular-nums">
                        {v.efficiency > 0 ? v.efficiency.toFixed(1) + " km/l" : "-"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium tabular-nums",
                          v.roi >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        {v.roi.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
