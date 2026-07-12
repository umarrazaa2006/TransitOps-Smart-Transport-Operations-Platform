export const ROLES = {
  FLEET_MANAGER: "FLEET_MANAGER",
  DISPATCHER: "DISPATCHER",
  SAFETY_OFFICER: "SAFETY_OFFICER",
  FINANCIAL_ANALYST: "FINANCIAL_ANALYST",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
  ADMIN: "Administrator",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS);

export const VEHICLE_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
} as const;
export const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"] as const;

export const DRIVER_STATUS = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
} as const;
export const DRIVER_STATUSES = ["Available", "On Trip", "Off Duty", "Suspended"] as const;

export const TRIP_STATUS = {
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;
export const TRIP_STATUSES = ["Draft", "Dispatched", "Completed", "Cancelled"] as const;

export const MAINTENANCE_STATUS = { ACTIVE: "Active", COMPLETED: "Completed" } as const;
export const MAINTENANCE_STATUSES = ["Active", "Completed"] as const;

export const VEHICLE_TYPES = ["Van", "Truck", "Mini", "Bus", "Tanker", "Other"] as const;
export const LICENSE_CATEGORIES = ["LMV", "HMV", "MCWG", "Trailer", "Other"] as const;
export const EXPENSE_TYPES = ["Toll", "Maintenance", "Fuel", "Parking", "Misc", "Other"] as const;
export const SERVICE_TYPES = [
  "Oil Change",
  "Engine Repair",
  "Tyre Replace",
  "Brake Service",
  "General Service",
  "Bodywork",
  "Other",
] as const;
export const REGIONS = ["Ahmedabad", "Gandhinagar", "Vadodara", "Surat", "Rajkot"] as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", perm: "dashboard" },
  { href: "/fleet", label: "Fleet", icon: "Truck", perm: "fleet" },
  { href: "/drivers", label: "Drivers", icon: "Users", perm: "drivers" },
  { href: "/trips", label: "Trips", icon: "Route", perm: "trips" },
  { href: "/maintenance", label: "Maintenance", icon: "Wrench", perm: "maintenance" },
  { href: "/expenses", label: "Fuel & Expenses", icon: "Fuel", perm: "expenses" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3", perm: "analytics" },
  { href: "/settings", label: "Settings", icon: "Settings", perm: "settings" },
] as const;
