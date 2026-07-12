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
import { EXPENSE_TYPES } from "@/lib/constants";

export interface VehicleOpt {
  id: string;
  name: string;
  registrationNumber: string;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{message}</span>
    </div>
  );
}

export function FuelModal({
  open,
  onClose,
  onSuccess,
  vehicles,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: VehicleOpt[];
}) {
  const { toast } = useToast();
  const [vehicleId, setVehicleId] = React.useState("");
  const [liters, setLiters] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [date, setDate] = React.useState(toDateInput(new Date()));
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setVehicleId("");
      setLiters("");
      setCost("");
      setDate(toDateInput(new Date()));
      setError(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vehicleId) {
      setError("Select a vehicle");
      return;
    }
    setBusy(true);
    try {
      await apiSend("/api/fuel", "POST", {
        vehicleId,
        liters: Number(liters || 0),
        cost: Number(cost || 0),
        date,
      });
      toast({ title: "Fuel logged", variant: "success" });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Log Fuel"
      description="Record fuel purchased for a vehicle."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Vehicle">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select vehicle</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registrationNumber})
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Liters">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              required
            />
          </Field>
          <Field label="Cost">
            <Input
              type="number"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {error ? <ErrorBox message={error} /> : null}
        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Log Fuel"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export function ExpenseModal({
  open,
  onClose,
  onSuccess,
  vehicles,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicles: VehicleOpt[];
}) {
  const { toast } = useToast();
  const [type, setType] = React.useState<string>(EXPENSE_TYPES[0]);
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState("");
  const [date, setDate] = React.useState(toDateInput(new Date()));
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setType(EXPENSE_TYPES[0]);
      setAmount("");
      setDescription("");
      setVehicleId("");
      setDate(toDateInput(new Date()));
      setError(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiSend("/api/expenses", "POST", {
        type,
        amount: Number(amount || 0),
        description: description || null,
        vehicleId: vehicleId || null,
        date,
      });
      toast({ title: "Expense added", variant: "success" });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Expense"
      description="Record tolls, parking or other operational costs."
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
        </div>
        <Field label="Vehicle (optional)">
          <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">None</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.registrationNumber})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description (optional)">
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="NH-48 toll"
          />
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {error ? <ErrorBox message={error} /> : null}
        <ModalFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Add Expense"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
