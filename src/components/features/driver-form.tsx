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
import { toDateInput } from "@/lib/utils";
import { DRIVER_STATUSES, LICENSE_CATEGORIES, REGIONS } from "@/lib/constants";

export interface DriverRecord {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string | null;
  safetyScore: number;
  status: string;
  region: string | null;
}

type FormState = {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string;
  safetyScore: string;
  status: string;
  region: string;
};

function initial(d?: DriverRecord | null): FormState {
  return {
    name: d?.name ?? "",
    licenseNumber: d?.licenseNumber ?? "",
    licenseCategory: d?.licenseCategory ?? "LMV",
    licenseExpiry: toDateInput(d?.licenseExpiry) || "",
    contactNumber: d?.contactNumber ?? "",
    safetyScore: d ? String(d.safetyScore) : "100",
    status: d?.status ?? "Available",
    region: d?.region ?? "",
  };
}

export function DriverForm({
  open,
  onClose,
  onSuccess,
  driver,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  driver?: DriverRecord | null;
}) {
  const { toast } = useToast();
  const editing = !!driver;
  const [form, setForm] = React.useState<FormState>(() => initial(driver));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForm(initial(driver));
    setError(null);
  }, [driver, open]);

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
        safetyScore: Number(form.safetyScore || 0),
        contactNumber: form.contactNumber || null,
        region: form.region || null,
      };
      if (editing && driver) await apiSend("/api/drivers/" + driver.id, "PATCH", payload);
      else await apiSend("/api/drivers", "POST", payload);
      toast({ title: editing ? "Driver updated" : "Driver added", variant: "success" });
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
      title={editing ? "Edit Driver" : "Add Driver"}
      description="License number must be unique. Expired or suspended drivers cannot be dispatched."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Alex"
              required
            />
          </Field>
          <Field label="License Number">
            <Input
              value={form.licenseNumber}
              onChange={(e) => update("licenseNumber", e.target.value)}
              placeholder="DL-88213"
              required
            />
          </Field>
          <Field label="License Category">
            <Select
              value={form.licenseCategory}
              onChange={(e) => update("licenseCategory", e.target.value)}
            >
              {LICENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="License Expiry">
            <Input
              type="date"
              value={form.licenseExpiry}
              onChange={(e) => update("licenseExpiry", e.target.value)}
              required
            />
          </Field>
          <Field label="Contact Number">
            <Input
              value={form.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              placeholder="98765-43210"
            />
          </Field>
          <Field label="Safety Score (0-100)">
            <Input
              type="number"
              min="0"
              max="100"
              value={form.safetyScore}
              onChange={(e) => update("safetyScore", e.target.value)}
            />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => update("status", e.target.value)}>
              {DRIVER_STATUSES.map((s) => (
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
            {saving ? "Saving..." : "Save Driver"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
