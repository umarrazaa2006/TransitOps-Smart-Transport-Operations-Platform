"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { apiSend } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";

export interface CompletableTrip {
  id: string;
  tripCode: string;
  startOdometer: number | null;
  revenue: number;
  vehicle: { name: string; odometer: number } | null;
}

export function TripCompleteModal({
  open,
  onClose,
  onSuccess,
  trip,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trip: CompletableTrip | null;
}) {
  const { toast } = useToast();
  const start = trip?.startOdometer ?? trip?.vehicle?.odometer ?? 0;
  const [endOdometer, setEndOdometer] = React.useState("");
  const [fuelConsumed, setFuelConsumed] = React.useState("");
  const [fuelCost, setFuelCost] = React.useState("");
  const [revenue, setRevenue] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open && trip) {
      setEndOdometer(String(start));
      setFuelConsumed("");
      setFuelCost("");
      setRevenue(String(trip.revenue || ""));
      setError(null);
    }
  }, [open, trip, start]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    setSaving(true);
    setError(null);
    try {
      await apiSend("/api/trips/" + trip.id, "PATCH", {
        action: "complete",
        endOdometer: Number(endOdometer || 0),
        fuelConsumed: Number(fuelConsumed || 0),
        fuelCost: Number(fuelCost || 0),
        revenue: Number(revenue || 0),
      });
      toast({
        title: "Trip completed",
        description: "Vehicle and driver are now available.",
        variant: "success",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={"Complete Trip " + (trip?.tripCode ?? "")}
      description="Enter the final odometer and fuel consumed. This frees up the vehicle and driver."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Final Odometer (km)" hint={"Start: " + start}>
            <Input
              type="number"
              min={start}
              value={endOdometer}
              onChange={(e) => setEndOdometer(e.target.value)}
              required
            />
          </Field>
          <Field label="Fuel Consumed (L)">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={fuelConsumed}
              onChange={(e) => setFuelConsumed(e.target.value)}
              required
            />
          </Field>
          <Field label="Fuel Cost (optional)">
            <Input
              type="number"
              min="0"
              value={fuelCost}
              onChange={(e) => setFuelCost(e.target.value)}
            />
          </Field>
          <Field label="Trip Revenue (optional)">
            <Input
              type="number"
              min="0"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
            />
          </Field>
        </div>
        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" type="submit" disabled={saving}>
            {saving ? "Completing..." : "Complete Trip"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
