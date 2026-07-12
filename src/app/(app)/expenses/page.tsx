"use client";

import * as React from "react";
import { Fuel, Plus, Trash2, Download, Receipt } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FuelModal, ExpenseModal, type VehicleOpt } from "@/components/features/fuel-expense-forms";
import { useApi, apiSend } from "@/hooks/use-api";
import { useUser } from "@/components/layout/user-context";
import { useToast } from "@/components/ui/toast";
import { canManage } from "@/lib/rbac";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv";

interface FuelRow {
  id: string;
  liters: number;
  cost: number;
  date: string;
  vehicle: { name: string; registrationNumber: string } | null;
  trip: { tripCode: string } | null;
}
interface ExpenseRow {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  date: string;
  vehicle: { name: string } | null;
  trip: { tripCode: string } | null;
}
interface MaintRow {
  id: string;
  cost: number;
}

export default function ExpensesPage() {
  const { role } = useUser();
  const manage = canManage(role, "expenses");
  const { toast } = useToast();
  const fuel = useApi<{ logs: FuelRow[] }>("/api/fuel");
  const expenses = useApi<{ expenses: ExpenseRow[] }>("/api/expenses");
  const maintenance = useApi<{ logs: MaintRow[] }>("/api/maintenance");
  const vehicles = useApi<{ vehicles: VehicleOpt[] }>("/api/vehicles");

  const [fuelOpen, setFuelOpen] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    kind: "fuel" | "expense";
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const totalFuelCost = (fuel.data?.logs ?? []).reduce((s, f) => s + f.cost, 0);
  const totalMaintenanceCost = (maintenance.data?.logs ?? []).reduce((s, m) => s + m.cost, 0);
  const totalExpenses = (expenses.data?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const operationalCost = totalFuelCost + totalMaintenanceCost;

  async function confirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const url =
        deleteItem.kind === "fuel"
          ? "/api/fuel/" + deleteItem.id
          : "/api/expenses/" + deleteItem.id;
      await apiSend(url, "DELETE");
      toast({ title: "Deleted", variant: "success" });
      setDeleteItem(null);
      if (deleteItem.kind === "fuel") fuel.refresh();
      else expenses.refresh();
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
    const rows: (string | number)[][] = [];
    (fuel.data?.logs ?? []).forEach((f) =>
      rows.push(["Fuel", f.vehicle?.name ?? "", formatDate(f.date), f.liters, f.cost, ""])
    );
    (expenses.data?.expenses ?? []).forEach((e) =>
      rows.push([
        e.type,
        e.vehicle?.name ?? "",
        formatDate(e.date),
        "",
        e.amount,
        e.description ?? "",
      ])
    );
    downloadCsv(
      "transitops-fuel-expenses.csv",
      ["Category", "Vehicle", "Date", "Liters", "Amount", "Notes"],
      rows
    );
  }

  const vehicleOpts = vehicles.data?.vehicles ?? [];

  return (
    <div>
      <PageHeader
        title="Fuel & Expenses"
        description="Track fuel consumption and operational expenses."
      >
        <Button variant="outline" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        {manage ? (
          <>
            <Button variant="secondary" onClick={() => setFuelOpen(true)}>
              <Fuel className="h-4 w-4" /> Log Fuel
            </Button>
            <Button onClick={() => setExpenseOpen(true)}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          </>
        ) : null}
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Fuel Cost</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(totalFuelCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Maintenance
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {formatCurrency(totalMaintenanceCost)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-primary">
              Operational Cost (Fuel + Maint)
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-primary">
              {formatCurrency(operationalCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Fuel Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {fuel.loading && !fuel.data ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (fuel.data?.logs.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Fuel className="h-8 w-8" />}
              title="No fuel logs"
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Liters</TableHead>
                  <TableHead>Fuel Cost</TableHead>
                  <TableHead>Trip</TableHead>
                  {manage ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuel.data?.logs.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.vehicle?.name ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(f.date)}</TableCell>
                    <TableCell className="tabular-nums">{formatNumber(f.liters, 1)} L</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(f.cost)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {f.trip?.tripCode ?? "-"}
                    </TableCell>
                    {manage ? (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDeleteItem({ kind: "fuel", id: f.id, label: "fuel log" })
                          }
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Expenses (Tolls / Misc)</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.loading && !expenses.data ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (expenses.data?.expenses.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="No expenses recorded"
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  {manage ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.data?.expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.type}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.vehicle?.name ?? "-"}
                    </TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    {manage ? (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setDeleteItem({ kind: "expense", id: e.id, label: "expense" })
                          }
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-4 border-t pt-3 text-right text-sm text-muted-foreground">
            Other expenses total:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(totalExpenses)}</span>
          </p>
        </CardContent>
      </Card>

      <FuelModal
        open={fuelOpen}
        onClose={() => setFuelOpen(false)}
        onSuccess={fuel.refresh}
        vehicles={vehicleOpts}
      />
      <ExpenseModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSuccess={expenses.refresh}
        vehicles={vehicleOpts}
      />
      <ConfirmDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete entry?"
        description={deleteItem ? "This will remove the " + deleteItem.label + "." : ""}
      />
    </div>
  );
}
