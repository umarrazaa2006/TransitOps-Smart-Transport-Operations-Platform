"use client";

import * as React from "react";
import { Check, Minus, Save, Shield } from "lucide-react";
import { PageHeader } from "@/components/features/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
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
import { useApi, apiSend } from "@/hooks/use-api";
import { useUser } from "@/components/layout/user-context";
import { useToast } from "@/components/ui/toast";
import { canManage, RBAC_MATRIX, type AccessLevel, type Resource } from "@/lib/rbac";

interface SettingData {
  setting: { depotName: string; currency: string; distanceUnit: string };
}

const rbacColumns: { key: Resource; label: string }[] = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "expenses", label: "Fuel/Exp." },
  { key: "analytics", label: "Analytics" },
];

function AccessCell({ level }: { level: AccessLevel }) {
  if (level === "manage") return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  if (level === "view") return <span className="text-xs text-muted-foreground">View</span>;
  return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}

export default function SettingsPage() {
  const { role } = useUser();
  const manage = canManage(role, "settings");
  const { toast } = useToast();
  const { data, loading, refresh } = useApi<SettingData>("/api/settings");

  const [depotName, setDepotName] = React.useState("");
  const [currency, setCurrency] = React.useState("INR");
  const [distanceUnit, setDistanceUnit] = React.useState("Kilometers");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (data?.setting) {
      setDepotName(data.setting.depotName);
      setCurrency(data.setting.currency);
      setDistanceUnit(data.setting.distanceUnit);
    }
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiSend("/api/settings", "PATCH", { depotName, currency, distanceUnit });
      toast({ title: "Settings saved", variant: "success" });
      refresh();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings & RBAC"
        description="Depot configuration and role-based access overview."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <form onSubmit={save} className="space-y-4">
                <Field label="Depot Name">
                  <Input
                    value={depotName}
                    onChange={(e) => setDepotName(e.target.value)}
                    disabled={!manage}
                  />
                </Field>
                <Field label="Currency">
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={!manage}
                  >
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </Select>
                </Field>
                <Field label="Distance Unit">
                  <Select
                    value={distanceUnit}
                    onChange={(e) => setDistanceUnit(e.target.value)}
                    disabled={!manage}
                  >
                    <option value="Kilometers">Kilometers</option>
                    <option value="Miles">Miles</option>
                  </Select>
                </Field>
                {manage ? (
                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    You have read-only access to settings.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Role-Based Access (RBAC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  {rbacColumns.map((c) => (
                    <TableHead key={c.key} className="text-center">
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {RBAC_MATRIX.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {rbacColumns.map((c) => (
                      <TableCell key={c.key} className="text-center">
                        <AccessCell level={row.cells[c.key]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-4 text-xs text-muted-foreground">
              Your role: <span className="font-medium text-foreground">{role}</span>. Access is
              enforced in middleware and every API route.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
