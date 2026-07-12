import * as React from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  green: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  blue: "bg-sky-500/15 text-sky-400 ring-sky-500/30",
  amber: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
  red: "bg-rose-500/15 text-rose-400 ring-rose-500/30",
  gray: "bg-muted text-muted-foreground ring-border",
  primary: "bg-primary/15 text-primary ring-primary/30",
};

export type Tone = keyof typeof toneClasses;

export function Badge({
  tone = "gray",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

const STATUS_TONE: Record<string, Tone> = {
  Available: "green",
  Completed: "green",
  "On Trip": "blue",
  Dispatched: "blue",
  "In Shop": "amber",
  Suspended: "amber",
  Active: "amber",
  "Off Duty": "gray",
  Draft: "gray",
  Retired: "red",
  Cancelled: "red",
};

export function statusTone(status: string): Tone {
  return STATUS_TONE[status] ?? "gray";
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {status}
    </Badge>
  );
}
