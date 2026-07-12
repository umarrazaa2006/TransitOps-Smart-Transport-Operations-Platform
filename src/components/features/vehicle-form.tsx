"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { apiSend } from "@/hooks/use-api";
import { useToast } from "@/components/ui/toast";
import { VEHICLE_TYPES, VEHICLE_STATUSES, REGIONS } from "@/lib/constants";

export interface VehicleRecord {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
  region: string | null;
}

type FormState = {
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: string;
  odometer: string;
  acquisitionCost: string;
  status: string;
  region: string;
};

function initial(v?: VehicleRecord | null): FormState {
  return {
    registrationNumber: v?.registrationNumber ?? "",
    name: v?.name ?? "",
    type: v?.type ?? "Van",
    maxLoadCapacity: v ? String(v.maxLoadCapacity) : "",
    odometer: v ? String(v.odometer) : "0",
    acquisitionCost: v ? String(v.acquisitionCost) : "0",
    status: v?.status ?? "Available",
    region: v?.region ?? "",
  };
}

export function VehicleForm({
  open,
  onClose,
  onSuccess,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle?: VehicleRecord | null;
}) {
  const { toast } = useToast();
  const editing = !!vehicle;
  const [form, setForm] = React.useState<FormState>(() => initial(vehicle));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForm(initial(vehicle));
    setError(null);
  }, [vehicle, open]);

  function update<K extends keyof FormState>(k: K, v: string) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        maxLoadCapacity: Number(form.maxLoadCapacity || 0),
        odometer: Number(form.odometer || 0),
        acquisitionCost: Number(form.acquisitionCost || 0),
        region: form.region || null,
      };
      if (editing && vehicle) await apiSend("/api/vehicles/" + vehicle.id, "PATCH", payload);
      else await apiSend("/api/vehicles", "POST", payload);
      toast({ title: editing ? "Vehicle updated" : "Vehicle added", variant: "success" });
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
      title={editing ? "Edit Vehicle" : "Add Vehicle"}
      description="Registration number must be unique across the fleet."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Registration Number">
            <Input
              value={form.registrationNumber}
              onChange={(e) => update("registrationNumber", e.target.value)}
              placeholder="GJ01AB1234"
              required
            />
          </Field>
          <Field label="Name / Model">
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Van-05"
              required
            />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => update("type", e.target.value)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Max Load Capacity (kg)">
            <Input
              type="number"
              min="0"
              value={form.maxLoadCapacity}
              onChange={(e) => update("maxLoadCapacity", e.target.value)}
              placeholder="500"
              required
            />
          </Field>
          <Field label="Odometer (km)">
            <Input
              type="number"
              min="0"
              value={form.odometer}
              onChange={(e) => update("odometer", e.target.value)}
            />
          </Field>
          <Field label="Acquisition Cost">
            <Input
              type="number"
              min="0"
              value={form.acquisitionCost}
              onChange={(e) => update("acquisitionCost", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => update("status", e.target.value)}>
              {VEHICLE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Region">
            <Select value={form.region} onChange={(e) => update("region", e.target.value)}>
              <option value="">Unassigned</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Vehicle"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
