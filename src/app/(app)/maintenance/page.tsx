"use client";

import * as React from "react";
import { Wrench, Save, CheckCircle2, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useApi, apiSend } from "@/hooks/use-api";
import { useUser } from "@/components/layout/user-context";
import { useToast } from "@/components/ui/toast";
import { canManage } from "@/lib/rbac";
import { formatCurrency, formatDate, toDateInput } from "@/lib/utils";
import { SERVICE_TYPES } from "@/lib/constants";

interface VehicleOpt {
  id: string;
  name: string;
  registrationNumber: string;
  status: string;
}
interface LogRow {
  id: string;
  serviceType: string;
  cost: number;
  date: string;
  status: string;
  notes: string | null;
  vehicle: { id: string; name: string; registrationNumber: string } | null;
}

export default function MaintenancePage() {
  const { role } = useUser();
  const manage = canManage(role, "maintenance");
  const { toast } = useToast();
  const vehicles = useApi<{ vehicles: VehicleOpt[] }>("/api/vehicles");
  const logs = useApi<{ logs: LogRow[] }>("/api/maintenance");

  const [vehicleId, setVehicleId] = React.useState("");
  const [serviceType, setServiceType] = React.useState<string>(SERVICE_TYPES[0]);
  const [cost, setCost] = React.useState("");
  const [date, setDate] = React.useState(toDateInput(new Date()));
  const [status, setStatus] = React.useState("Active");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<LogRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  function refreshAll() {
    logs.refresh();
    vehicles.refresh();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vehicleId) {
      setError("Select a vehicle");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/maintenance", "POST", {
        vehicleId,
        serviceType,
        cost: Number(cost || 0),
        date,
        status,
        notes: notes || null,
      });
      toast({
        title: "Maintenance logged",
        description: status === "Active" ? "Vehicle moved to In Shop." : "",
        variant: "success",
      });
      setVehicleId("");
      setCost("");
      setNotes("");
      setStatus("Active");
      refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function setLogStatus(log: LogRow, next: "Active" | "Completed") {
    try {
      await apiSend("/api/maintenance/" + log.id, "PATCH", { status: next });
      toast({
        title: next === "Completed" ? "Service closed" : "Service reopened",
        variant: "success",
      });
      refreshAll();
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "",
        variant: "error",
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend("/api/maintenance/" + deleteTarget.id, "DELETE");
      toast({ title: "Record deleted", variant: "success" });
      setDeleteTarget(null);
      refreshAll();
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

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Log service records. Active records move a vehicle to In Shop."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        {manage ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Log Service Record</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={save} className="space-y-4">
                <Field label="Vehicle">
                  <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    <option value="">Select vehicle</option>
                    {(vehicles.data?.vehicles ?? [])
                      .filter((v) => v.status !== "Retired")
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.registrationNumber})
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Service Type">
                  <Select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cost">
                    <Input
                      type="number"
                      min="0"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      placeholder="2500"
                    />
                  </Field>
                  <Field label="Date">
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </Field>
                </div>
                <Field label="Status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Active">Active (moves to In Shop)</option>
                    <option value="Completed">Completed</option>
                  </Select>
                </Field>
                <Field label="Notes (optional)">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Details..."
                  />
                </Field>
                {error ? (
                  <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={busy}>
                  <Save className="h-4 w-4" /> {busy ? "Saving..." : "Save Record"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Active record &rarr; vehicle In Shop. Closing a record &rarr; vehicle Available
                  (unless retired). In Shop vehicles are hidden from the dispatch pool.
                </p>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card className={manage ? "lg:col-span-3" : "lg:col-span-5"}>
          <CardHeader>
            <CardTitle>Service Log</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.loading && !logs.data ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (logs.data?.logs.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Wrench className="h-8 w-8" />}
                title="No service records"
                className="border-0"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {manage ? <TableHead className="text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.data?.logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.vehicle?.name ?? "-"}</TableCell>
                      <TableCell>{l.serviceType}</TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(l.cost)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(l.date)}</TableCell>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      {manage ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {l.status === "Active" ? (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => setLogStatus(l, "Completed")}
                              >
                                <CheckCircle2 className="h-4 w-4" /> Close
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setLogStatus(l, "Active")}
                              >
                                <RotateCcw className="h-4 w-4" /> Reopen
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteTarget(l)}
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
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete maintenance record?"
        description="If this was the only active record, the vehicle will return to Available."
      />
    </div>
  );
}
