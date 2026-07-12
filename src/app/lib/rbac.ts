export type AccessLevel = "none" | "view" | "manage";
export type Resource =
  | "dashboard"
  | "fleet"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "analytics"
  | "settings";

export const PERMISSIONS: Record<string, Record<Resource, AccessLevel>> = {
  ADMIN: {
    dashboard: "manage",
    fleet: "manage",
    drivers: "manage",
    trips: "manage",
    maintenance: "manage",
    expenses: "manage",
    analytics: "manage",
    settings: "manage",
  },
  FLEET_MANAGER: {
    dashboard: "view",
    fleet: "manage",
    drivers: "manage",
    trips: "view",
    maintenance: "manage",
    expenses: "view",
    analytics: "view",
    settings: "manage",
  },
  DISPATCHER: {
    dashboard: "view",
    fleet: "view",
    drivers: "view",
    trips: "manage",
    maintenance: "none",
    expenses: "none",
    analytics: "none",
    settings: "view",
  },
  SAFETY_OFFICER: {
    dashboard: "view",
    fleet: "none",
    drivers: "manage",
    trips: "view",
    maintenance: "none",
    expenses: "none",
    analytics: "none",
    settings: "view",
  },
  FINANCIAL_ANALYST: {
    dashboard: "view",
    fleet: "view",
    drivers: "none",
    trips: "none",
    maintenance: "view",
    expenses: "manage",
    analytics: "manage",
    settings: "view",
  },
};

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, manage: 2 };

export function getAccess(role: string | undefined | null, resource: Resource): AccessLevel {
  if (!role) return "none";
  const p = PERMISSIONS[role];
  if (!p) return "none";
  return p[resource] ?? "none";
}

export function can(
  role: string | undefined | null,
  resource: Resource,
  level: AccessLevel = "view"
): boolean {
  return RANK[getAccess(role, resource)] >= RANK[level];
}

export function canManage(role: string | undefined | null, resource: Resource): boolean {
  return can(role, resource, "manage");
}

export const RBAC_MATRIX: { role: string; label: string; cells: Record<Resource, AccessLevel> }[] =
  [
    { role: "FLEET_MANAGER", label: "Fleet Manager", cells: PERMISSIONS.FLEET_MANAGER },
    { role: "DISPATCHER", label: "Dispatcher", cells: PERMISSIONS.DISPATCHER },
    { role: "SAFETY_OFFICER", label: "Safety Officer", cells: PERMISSIONS.SAFETY_OFFICER },
    { role: "FINANCIAL_ANALYST", label: "Financial Analyst", cells: PERMISSIONS.FINANCIAL_ANALYST },
  ];
