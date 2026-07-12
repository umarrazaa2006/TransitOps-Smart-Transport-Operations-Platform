type VehicleLike = { status: string; maxLoadCapacity: number } | null;
type DriverLike = { status: string; licenseExpiry: Date | string } | null;

export function assignmentError(
  vehicle: VehicleLike,
  driver: DriverLike,
  cargoWeight: number
): string | null {
  if (!vehicle) return "Please select a vehicle";
  if (!driver) return "Please select a driver";
  if (vehicle.status === "Retired") return "Retired vehicles cannot be dispatched";
  if (vehicle.status === "In Shop") return "This vehicle is in the shop and cannot be dispatched";
  if (vehicle.status === "On Trip") return "This vehicle is already on a trip";
  if (vehicle.status !== "Available") return "This vehicle is not available";
  if (driver.status === "Suspended") return "Suspended drivers cannot be assigned to trips";
  if (new Date(driver.licenseExpiry).getTime() < Date.now())
    return "This driver license has expired";
  if (driver.status === "On Trip") return "This driver is already on a trip";
  if (driver.status !== "Available") return "This driver is not available";
  if (cargoWeight > vehicle.maxLoadCapacity) {
    return (
      "Cargo weight exceeds vehicle capacity by " + (cargoWeight - vehicle.maxLoadCapacity) + " kg"
    );
  }
  return null;
}
