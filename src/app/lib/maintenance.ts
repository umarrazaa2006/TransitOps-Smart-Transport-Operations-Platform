import type { Prisma } from "@prisma/client";

export async function reconcileVehicleStatus(tx: Prisma.TransactionClient, vehicleId: string) {
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.status === "Retired" || vehicle.status === "On Trip") return;
  const active = await tx.maintenanceLog.count({ where: { vehicleId, status: "Active" } });
  const target = active > 0 ? "In Shop" : "Available";
  if (vehicle.status !== target) {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: target } });
  }
}
