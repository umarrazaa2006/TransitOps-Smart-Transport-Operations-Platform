import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

const accents = {
  primary: "bg-primary",
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
  violet: "bg-violet-500",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "primary",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  accent?: keyof typeof accents;
  hint?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute inset-y-0 left-0 w-1", accents[accent])} />
      <div className="flex items-start justify-between p-4 pl-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div className={cn("rounded-lg p-2 text-white", accents[accent])}>{icon}</div>
        ) : null}
      </div>
    </Card>
  );
}
