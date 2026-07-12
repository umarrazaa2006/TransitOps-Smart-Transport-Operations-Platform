"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Download, ArrowUpDown, Truck } from "lucide-react";
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
import { VehicleForm, type VehicleRecord } from "@/components/features/vehicle-form";
import { useApi, apiSend } from "@/hooks/use-api";
import { useSearch } from "@/components/layout/search-context";
import { useUser } from "@/components/layout/user-context";
import { useToast } from "@/components/ui/toast";
import { canManage } from "@/lib/rbac";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { VEHICLE_TYPES, VEHICLE_STATUSES } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";

type SortKey = keyof VehicleRecord;

export default function FleetPage() {
  const { query } = useSearch();
  const { role } = useUser();
  const manage = canManage(role, "fleet");
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<{ vehicles: VehicleRecord[] }>("/api/vehicles");

  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [sortKey, setSortKey] = React.useState<SortKey>("name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VehicleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<VehicleRecord | null>(null);
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
    const list = (data?.vehicles ?? []).filter((v) => {
      if (typeFilter && v.type !== typeFilter) return false;
      if (statusFilter && v.status !== statusFilter) return false;
      if (
        q &&
        !(v.registrationNumber.toLowerCase().includes(q) || v.name.toLowerCase().includes(q))
      )
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
  }, [data, query, typeFilter, statusFilter, sortKey, sortDir]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend("/api/vehicles/" + deleteTarget.id, "DELETE");
      toast({ title: "Vehicle deleted", variant: "success" });
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
      "transitops-vehicles.csv",
      [
        "Registration",
        "Name",
        "Type",
        "Capacity (kg)",
        "Odometer",
        "Acquisition Cost",
        "Status",
        "Region",
      ],
      rows.map((v) => [
        v.registrationNumber,
        v.name,
        v.type,
        v.maxLoadCapacity,
        v.odometer,
        v.acquisitionCost,
        v.status,
        v.region ?? "",
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
      <PageHeader title="Vehicle Registry" description="Master list of every vehicle in the fleet.">
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
            <Plus className="h-4 w-4" /> Add Vehicle
          </Button>
        ) : null}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Type"
          >
            <option value="">All types</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Status"
          >
            <option value="">All status</option>
            {VEHICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mb-3 text-xs text-primary">
        Rule: Registration No. must be unique. Retired / In Shop vehicles are hidden from the Trip
        Dispatcher.
      </p>

      <Card>
        {loading && !data ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Truck className="h-8 w-8" />}
            title="No vehicles found"
            description="Try adjusting filters or add a new vehicle."
            className="m-4 border-0"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <Th label="Reg. No." k="registrationNumber" />
                <Th label="Name / Model" k="name" />
                <Th label="Type" k="type" />
                <Th label="Capacity" k="maxLoadCapacity" />
                <Th label="Odometer" k="odometer" />
                <Th label="Acq. Cost" k="acquisitionCost" />
                <Th label="Status" k="status" />
                {manage ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {v.registrationNumber}
                  </TableCell>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">{v.type}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatNumber(v.maxLoadCapacity)} kg
                  </TableCell>
                  <TableCell className="tabular-nums">{formatNumber(v.odometer)}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(v.acquisitionCost)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  {manage ? (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(v);
                            setFormOpen(true);
                          }}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(v)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <VehicleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refresh}
        vehicle={editing}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete vehicle?"
        description={
          deleteTarget
            ? "This will permanently remove " +
              deleteTarget.name +
              " (" +
              deleteTarget.registrationNumber +
              ")."
            : ""
        }
      />
    </div>
  );
}
