"use client";

import * as React from "react";
import { Send, FileText, CheckCircle2, XCircle, Trash2, AlertCircle, Route } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TripCompleteModal, type CompletableTrip } from "@/components/features/trip-complete-modal";
import { useApi, apiSend } from "@/hooks/use-api";
import { useUser } from "@/components/layout/user-context";
import { useToast } from "@/components/ui/toast";
import { canManage } from "@/lib/rbac";
import { cn, formatNumber } from "@/lib/utils";
import { REGIONS, TRIP_STATUSES } from "@/lib/constants";

interface VehicleOpt {
  id: string;
  name: string;
  maxLoadCapacity: number;
}
interface DriverOpt {
  id: string;
  name: string;
}
interface TripRow {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  cargoWeight: number;
  plannedDistance: number;
  revenue: number;
  status: string;
  startOdometer: number | null;
  vehicle: { id: string; name: string; odometer: number } | null;
  driver: { id: string; name: string } | null;
}

const stepTone: Record<string, string> = {
  Draft: "bg-muted-foreground",
  Dispatched: "bg-sky-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-rose-500",
};

export default function TripsPage() {
  const { role } = useUser();
  const manage = canManage(role, "trips");
  const { toast } = useToast();
  const trips = useApi<{ trips: TripRow[] }>("/api/trips");
  const vehicles = useApi<{ vehicles: VehicleOpt[] }>("/api/vehicles?available=1");
  const drivers = useApi<{ drivers: DriverOpt[] }>("/api/drivers?available=1");

  const [source, setSource] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState("");
  const [driverId, setDriverId] = React.useState("");
  const [cargoWeight, setCargoWeight] = React.useState("");
  const [plannedDistance, setPlannedDistance] = React.useState("");
  const [revenue, setRevenue] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const [completeTrip, setCompleteTrip] = React.useState<CompletableTrip | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TripRow | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const selectedVehicle = (vehicles.data?.vehicles ?? []).find((v) => v.id === vehicleId) || null;
  const cargoNum = Number(cargoWeight || 0);
  const overCapacity = !!selectedVehicle && cargoNum > selectedVehicle.maxLoadCapacity;
  const dispatchDisabled =
    !source || !destination || !vehicleId || !driverId || overCapacity || busy;

  function refreshAll() {
    trips.refresh();
    vehicles.refresh();
    drivers.refresh();
  }

  function resetForm() {
    setSource("");
    setDestination("");
    setVehicleId("");
    setDriverId("");
    setCargoWeight("");
    setPlannedDistance("");
    setRevenue("");
    setRegion("");
    setFormError(null);
  }

  async function create(action: "draft" | "dispatch") {
    setFormError(null);
    if (!source || !destination) {
      setFormError("Source and destination are required");
      return;
    }
    if (action === "dispatch" && (!vehicleId || !driverId)) {
      setFormError("Select an available vehicle and driver to dispatch");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/trips", "POST", {
        source,
        destination,
        vehicleId: vehicleId || null,
        driverId: driverId || null,
        cargoWeight: Number(cargoWeight || 0),
        plannedDistance: Number(plannedDistance || 0),
        revenue: Number(revenue || 0),
        region: region || null,
        action,
      });
      toast({
        title: action === "dispatch" ? "Trip dispatched" : "Draft saved",
        variant: "success",
      });
      resetForm();
      refreshAll();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function act(trip: TripRow, action: "dispatch" | "cancel") {
    try {
      await apiSend("/api/trips/" + trip.id, "PATCH", { action });
      toast({
        title: action === "dispatch" ? "Trip dispatched" : "Trip cancelled",
        variant: "success",
      });
      refreshAll();
    } catch (err) {
      toast({
        title: "Action failed",
        description: err instanceof Error ? err.message : "",
        variant: "error",
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend("/api/trips/" + deleteTarget.id, "DELETE");
      toast({ title: "Trip deleted", variant: "success" });
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
        title="Trip Dispatcher"
        description="Create, dispatch and track trips with automatic status transitions."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {manage ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Trip</CardTitle>
              <div className="mt-3 flex items-center gap-2">
                {TRIP_STATUSES.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2.5 w-2.5 rounded-full", stepTone[s])} />
                      <span className="text-xs text-muted-foreground">{s}</span>
                    </div>
                    {i < TRIP_STATUSES.length - 1 ? <span className="h-px w-4 bg-border" /> : null}
                  </React.Fragment>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source">
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Gandhinagar Depot"
                  />
                </Field>
                <Field label="Destination">
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ahmedabad Hub"
                  />
                </Field>
                <Field label="Vehicle (available only)">
                  <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                    <option value="">Select vehicle</option>
                    {(vehicles.data?.vehicles ?? []).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} - {formatNumber(v.maxLoadCapacity)} kg
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Driver (available only)">
                  <Select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                    <option value="">Select driver</option>
                    {(drivers.data?.drivers ?? []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Cargo Weight (kg)">
                  <Input
                    type="number"
                    min="0"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    placeholder="450"
                  />
                </Field>
                <Field label="Planned Distance (km)">
                  <Input
                    type="number"
                    min="0"
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(e.target.value)}
                    placeholder="42"
                  />
                </Field>
                <Field label="Revenue (optional)">
                  <Input
                    type="number"
                    min="0"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                  />
                </Field>
                <Field label="Region">
                  <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">Unassigned</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {selectedVehicle ? (
                <div
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    overCapacity
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-400"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  )}
                >
                  <p>
                    Vehicle capacity: <b>{formatNumber(selectedVehicle.maxLoadCapacity)} kg</b>{" "}
                    &middot; Cargo weight: <b>{formatNumber(cargoNum)} kg</b>
                  </p>
                  <p className="mt-0.5">
                    {overCapacity
                      ? "Capacity exceeded by " +
                        formatNumber(cargoNum - selectedVehicle.maxLoadCapacity) +
                        " kg - dispatch blocked."
                      : "Within capacity - ready to dispatch."}
                  </p>
                </div>
              ) : null}

              {formError ? (
                <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{formError}</span>
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={dispatchDisabled}
                  onClick={() => create("dispatch")}
                >
                  <Send className="h-4 w-4" /> Dispatch
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => create("draft")}
                >
                  <FileText className="h-4 w-4" /> Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className={manage ? "" : "lg:col-span-2"}>
          <CardHeader>
            <CardTitle>Live Board</CardTitle>
          </CardHeader>
          <CardContent>
            {trips.loading && !trips.data ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (trips.data?.trips.length ?? 0) === 0 ? (
              <EmptyState
                icon={<Route className="h-8 w-8" />}
                title="No trips yet"
                description="Create a trip to get started."
                className="border-0"
              />
            ) : (
              <div className="space-y-3">
                {trips.data?.trips.map((t) => (
                  <div key={t.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground">{t.tripCode}</span> &middot;{" "}
                          {t.source} &rarr; {t.destination}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {t.vehicle?.name ?? "Unassigned"} &middot; {t.driver?.name ?? "No driver"}{" "}
                          &middot; {formatNumber(t.cargoWeight)} kg
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    {manage ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {t.status === "Draft" ? (
                          <Button
                            size="sm"
                            onClick={() => act(t, "dispatch")}
                            disabled={!t.vehicle || !t.driver}
                          >
                            <Send className="h-4 w-4" /> Dispatch
                          </Button>
                        ) : null}
                        {t.status === "Dispatched" ? (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() =>
                              setCompleteTrip({
                                id: t.id,
                                tripCode: t.tripCode,
                                startOdometer: t.startOdometer,
                                revenue: t.revenue,
                                vehicle: t.vehicle,
                              })
                            }
                          >
                            <CheckCircle2 className="h-4 w-4" /> Complete
                          </Button>
                        ) : null}
                        {t.status === "Draft" || t.status === "Dispatched" ? (
                          <Button size="sm" variant="outline" onClick={() => act(t, "cancel")}>
                            <XCircle className="h-4 w-4" /> Cancel
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TripCompleteModal
        open={!!completeTrip}
        onClose={() => setCompleteTrip(null)}
        onSuccess={refreshAll}
        trip={completeTrip}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete trip?"
        description={
          deleteTarget
            ? "Delete " +
              deleteTarget.tripCode +
              "? Dispatched trips will release their vehicle and driver."
            : ""
        }
      />
    </div>
  );
}
