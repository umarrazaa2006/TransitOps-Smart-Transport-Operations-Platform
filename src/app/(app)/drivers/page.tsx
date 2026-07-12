"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Download, ArrowUpDown, Users, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DriverForm, type DriverRecord } from "@/components/features/driver-form";
import { useApi, apiSend } from "@/hooks/use-api";
import { useSearch } from "@/components/layout/search-context";
import { useUser } from "@/components/layout/user-context";
import { useToast } from "@/components/ui/toast";
import { canManage } from "@/lib/rbac";
import { cn, formatDate, isLicenseExpired, isLicenseExpiringSoon } from "@/lib/utils";
import { DRIVER_STATUSES } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";

type SortKey = keyof DriverRecord;

function safetyColor(score: number): string {
  if (score >= 90) return "text-emerald-500";
  if (score >= 75) return "text-amber-500";
  return "text-rose-500";
}

export default function DriversPage() {
  const { query } = useSearch();
  const { role } = useUser();
  const manage = canManage(role, "drivers");
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<{ drivers: DriverRecord[] }>("/api/drivers");

  const [statusFilter, setStatusFilter] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<DriverRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DriverRecord | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  function onSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (data?.drivers ?? []).filter((d) => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (q && !(d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q)))
        return false;
      return true;
    });
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let r = 0;
      if (typeof av === "number" && typeof bv === "number") r = av - bv;
      else r = String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? r : -r;
    });
    return list;
  }, [data, query, statusFilter, sortKey, sortDir]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend("/api/drivers/" + deleteTarget.id, "DELETE");
      toast({ title: "Driver deleted", variant: "success" });
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "",
        variant: "error",
      });
    } finally {
      setDeleting(false);
    }
  }

  function exportCsv() {
    downloadCsv(
      "transitops-drivers.csv",
      ["Name", "License", "Category", "Expiry", "Contact", "Safety Score", "Status", "Region"],
      rows.map((d) => [
        d.name,
        d.licenseNumber,
        d.licenseCategory,
        formatDate(d.licenseExpiry),
        d.contactNumber ?? "",
        d.safetyScore,
        d.status,
        d.region ?? "",
      ])
    );
  }

  const Th = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label}
        <ArrowUpDown
          className={cn("h-3 w-3", sortKey === k ? "text-primary" : "text-muted-foreground/40")}
        />
      </button>
    </TableHead>
  );

  return (
    <div>
      <PageHeader
        title="Drivers & Safety Profiles"
        description="Compliance, licensing and safety at a glance."
      >
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        {manage ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Driver
          </Button>
        ) : null}
      </PageHeader>

      <div className="mb-4 w-40">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Status"
        >
          <option value="">All status</option>
          {DRIVER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <p className="mb-3 text-xs text-primary">
        Rule: Drivers with an expired license or Suspended status are blocked from trip assignment.
      </p>

      <Card>
        {loading && !data ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No drivers found"
            description="Try adjusting filters or add a new driver."
            className="m-4 border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <Th label="Driver" k="name" />
                <Th label="License No" k="licenseNumber" />
                <Th label="Category" k="licenseCategory" />
                <Th label="Expiry" k="licenseExpiry" />
                <TableHead>Contact</TableHead>
                <Th label="Safety" k="safetyScore" />
                <Th label="Status" k="status" />
                {manage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => {
                const expired = isLicenseExpired(d.licenseExpiry);
                const soon = isLicenseExpiringSoon(d.licenseExpiry);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{d.licenseCategory}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        {formatDate(d.licenseExpiry)}
                        {expired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-medium text-rose-400">
                            <AlertTriangle className="h-3 w-3" /> Expired
                          </span>
                        ) : soon ? (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-500">
                            Expiring
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.contactNumber ?? "-"}
                    </TableCell>
                    <TableCell
                      className={cn("font-semibold tabular-nums", safetyColor(d.safetyScore))}
                    >
                      {d.safetyScore}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    {manage ? (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(d);
                              setFormOpen(true);
                            }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(d)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-rose-500" />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <DriverForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refresh}
        driver={editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete driver?"
        description={deleteTarget ? "This will permanently remove " + deleteTarget.name + "." : ""}
      />
    </div>
  );
}
