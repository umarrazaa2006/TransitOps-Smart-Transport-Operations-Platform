import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function days(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.vehicleDocument.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = [
    { name: "Fiona Fleet", email: "fleet@transitops.in", role: "FLEET_MANAGER" },
    { name: "Raven K.", email: "dispatch@transitops.in", role: "DISPATCHER" },
    { name: "Sam Safety", email: "safety@transitops.in", role: "SAFETY_OFFICER" },
    { name: "Fred Finance", email: "finance@transitops.in", role: "FINANCIAL_ANALYST" },
    { name: "Admin User", email: "admin@transitops.in", role: "ADMIN" },
  ];
  for (const u of users) await prisma.user.create({ data: { ...u, passwordHash } });

  console.log("Seeding vehicles...");
  const vehicleData = [
    {
      registrationNumber: "GJ01AB4521",
      name: "Van-05",
      type: "Van",
      maxLoadCapacity: 500,
      odometer: 74000,
      acquisitionCost: 620000,
      status: "On Trip",
      region: "Gandhinagar",
    },
    {
      registrationNumber: "GJ01AB9985",
      name: "Truck-11",
      type: "Truck",
      maxLoadCapacity: 5000,
      odometer: 182000,
      acquisitionCost: 2450000,
      status: "Available",
      region: "Ahmedabad",
    },
    {
      registrationNumber: "GJ01AB1120",
      name: "Mini-03",
      type: "Mini",
      maxLoadCapacity: 1000,
      odometer: 66000,
      acquisitionCost: 410000,
      status: "In Shop",
      region: "Vadodara",
    },
    {
      registrationNumber: "GJ01AB0008",
      name: "Van-09",
      type: "Van",
      maxLoadCapacity: 750,
      odometer: 241400,
      acquisitionCost: 540000,
      status: "Retired",
      region: "Surat",
    },
    {
      registrationNumber: "GJ04CD5567",
      name: "Truck-04",
      type: "Truck",
      maxLoadCapacity: 8000,
      odometer: 98000,
      acquisitionCost: 2800000,
      status: "Available",
      region: "Surat",
    },
    {
      registrationNumber: "GJ05EF3321",
      name: "Mini-08",
      type: "Mini",
      maxLoadCapacity: 1200,
      odometer: 52000,
      acquisitionCost: 460000,
      status: "On Trip",
      region: "Ahmedabad",
    },
    {
      registrationNumber: "GJ02GH7788",
      name: "Bus-02",
      type: "Bus",
      maxLoadCapacity: 3000,
      odometer: 130000,
      acquisitionCost: 3200000,
      status: "On Trip",
      region: "Gandhinagar",
    },
    {
      registrationNumber: "GJ01AB7777",
      name: "Van-12",
      type: "Van",
      maxLoadCapacity: 600,
      odometer: 41000,
      acquisitionCost: 610000,
      status: "Available",
      region: "Rajkot",
    },
    {
      registrationNumber: "GJ03IJ4455",
      name: "Tanker-01",
      type: "Tanker",
      maxLoadCapacity: 12000,
      odometer: 210000,
      acquisitionCost: 4100000,
      status: "Available",
      region: "Vadodara",
    },
    {
      registrationNumber: "GJ06KL9900",
      name: "Mini-15",
      type: "Mini",
      maxLoadCapacity: 900,
      odometer: 12000,
      acquisitionCost: 480000,
      status: "Available",
      region: "Rajkot",
    },
  ];
  const vehicles: Record<string, string> = {};
  for (const v of vehicleData) {
    const created = await prisma.vehicle.create({ data: v });
    vehicles[v.registrationNumber] = created.id;
  }

  console.log("Seeding drivers...");
  const driverData = [
    {
      name: "Alex",
      licenseNumber: "DL-88213",
      licenseCategory: "LMV",
      licenseExpiry: days(900),
      contactNumber: "98765-43210",
      safetyScore: 96,
      status: "On Trip",
      region: "Gandhinagar",
    },
    {
      name: "John",
      licenseNumber: "DL-44120",
      licenseCategory: "HMV",
      licenseExpiry: daysAgo(120),
      contactNumber: "98220-12345",
      safetyScore: 81,
      status: "Suspended",
      region: "Ahmedabad",
    },
    {
      name: "Priya",
      licenseNumber: "DL-77031",
      licenseCategory: "LMV",
      licenseExpiry: days(400),
      contactNumber: "99110-23456",
      safetyScore: 89,
      status: "On Trip",
      region: "Vadodara",
    },
    {
      name: "Suresh",
      licenseNumber: "DL-90045",
      licenseCategory: "HMV",
      licenseExpiry: days(200),
      contactNumber: "97440-34567",
      safetyScore: 88,
      status: "Off Duty",
      region: "Surat",
    },
    {
      name: "Meena",
      licenseNumber: "DL-66210",
      licenseCategory: "LMV",
      licenseExpiry: days(25),
      contactNumber: "98120-45678",
      safetyScore: 92,
      status: "Available",
      region: "Ahmedabad",
    },
    {
      name: "Rahul",
      licenseNumber: "DL-55198",
      licenseCategory: "HMV",
      licenseExpiry: daysAgo(30),
      contactNumber: "98980-56789",
      safetyScore: 74,
      status: "Suspended",
      region: "Rajkot",
    },
    {
      name: "Arjun",
      licenseNumber: "DL-33027",
      licenseCategory: "LMV",
      licenseExpiry: days(1100),
      contactNumber: "97000-67890",
      safetyScore: 85,
      status: "On Trip",
      region: "Gandhinagar",
    },
    {
      name: "Kavya",
      licenseNumber: "DL-22011",
      licenseCategory: "LMV",
      licenseExpiry: days(700),
      contactNumber: "96540-78901",
      safetyScore: 90,
      status: "Available",
      region: "Vadodara",
    },
  ];
  const drivers: Record<string, string> = {};
  for (const d of driverData) {
    const created = await prisma.driver.create({ data: d });
    drivers[d.name] = created.id;
  }

  console.log("Seeding trips...");
  const tripData = [
    {
      tripCode: "TR001",
      source: "Gandhinagar Depot",
      destination: "Ahmedabad Hub",
      vehicleId: vehicles["GJ01AB4521"],
      driverId: drivers["Alex"],
      cargoWeight: 450,
      plannedDistance: 42,
      status: "Dispatched",
      region: "Gandhinagar",
      dispatchedAt: daysAgo(0),
      revenue: 0,
    },
    {
      tripCode: "TR002",
      source: "Ahmedabad Hub",
      destination: "Surat Warehouse",
      vehicleId: vehicles["GJ01AB9985"],
      driverId: drivers["Meena"],
      cargoWeight: 3200,
      plannedDistance: 210,
      status: "Completed",
      region: "Ahmedabad",
      dispatchedAt: daysAgo(6),
      completedAt: daysAgo(5),
      startOdometer: 181790,
      endOdometer: 182000,
      fuelConsumed: 26,
      revenue: 46000,
    },
    {
      tripCode: "TR003",
      source: "Vatva Industrial Area",
      destination: "Sanand Warehouse",
      vehicleId: vehicles["GJ05EF3321"],
      driverId: drivers["Priya"],
      cargoWeight: 900,
      plannedDistance: 38,
      status: "Dispatched",
      region: "Ahmedabad",
      dispatchedAt: daysAgo(0),
      revenue: 0,
    },
    {
      tripCode: "TR004",
      source: "Vatva Industrial Area",
      destination: "Sanand Warehouse",
      vehicleId: vehicles["GJ04CD5567"],
      driverId: null,
      cargoWeight: 5200,
      plannedDistance: 44,
      status: "Draft",
      region: "Ahmedabad",
      revenue: 0,
    },
    {
      tripCode: "TR005",
      source: "Gandhinagar Depot",
      destination: "Vadodara Yard",
      vehicleId: vehicles["GJ01AB7777"],
      driverId: drivers["Kavya"],
      cargoWeight: 420,
      plannedDistance: 110,
      status: "Completed",
      region: "Gandhinagar",
      dispatchedAt: daysAgo(9),
      completedAt: daysAgo(8),
      startOdometer: 40890,
      endOdometer: 41000,
      fuelConsumed: 13,
      revenue: 18500,
    },
    {
      tripCode: "TR006",
      source: "Gandhinagar Depot",
      destination: "Kalol Depot",
      vehicleId: vehicles["GJ02GH7788"],
      driverId: drivers["Arjun"],
      cargoWeight: 1800,
      plannedDistance: 30,
      status: "Dispatched",
      region: "Gandhinagar",
      dispatchedAt: daysAgo(0),
      revenue: 0,
    },
    {
      tripCode: "TR007",
      source: "Rajkot Center",
      destination: "Morbi Plant",
      vehicleId: null,
      driverId: null,
      cargoWeight: 0,
      plannedDistance: 0,
      status: "Draft",
      region: "Rajkot",
      revenue: 0,
    },
    {
      tripCode: "TR008",
      source: "Surat Warehouse",
      destination: "Rajkot Center",
      vehicleId: vehicles["GJ04CD5567"],
      driverId: drivers["Suresh"],
      cargoWeight: 6000,
      plannedDistance: 245,
      status: "Completed",
      region: "Surat",
      dispatchedAt: daysAgo(14),
      completedAt: daysAgo(13),
      startOdometer: 97755,
      endOdometer: 98000,
      fuelConsumed: 34,
      revenue: 52000,
    },
    {
      tripCode: "TR009",
      source: "Mansa",
      destination: "Kalol Depot",
      vehicleId: vehicles["GJ01AB1120"],
      driverId: null,
      cargoWeight: 600,
      plannedDistance: 26,
      status: "Cancelled",
      region: "Gandhinagar",
      cancelledAt: daysAgo(2),
      revenue: 0,
    },
    {
      tripCode: "TR010",
      source: "Rajkot Center",
      destination: "Jamnagar Hub",
      vehicleId: vehicles["GJ06KL9900"],
      driverId: drivers["Kavya"],
      cargoWeight: 700,
      plannedDistance: 60,
      status: "Completed",
      region: "Rajkot",
      dispatchedAt: daysAgo(20),
      completedAt: daysAgo(19),
      startOdometer: 11940,
      endOdometer: 12000,
      fuelConsumed: 6,
      revenue: 9000,
    },
  ];
  for (const t of tripData) await prisma.trip.create({ data: t });

  console.log("Seeding maintenance logs...");
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles["GJ01AB1120"],
      serviceType: "Tyre Replace",
      cost: 6200,
      status: "Active",
      date: daysAgo(1),
      notes: "Front tyres worn out",
    },
  });
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles["GJ01AB9985"],
      serviceType: "Engine Repair",
      cost: 18000,
      status: "Completed",
      date: daysAgo(12),
      closedAt: daysAgo(10),
      notes: "Turbo replaced",
    },
  });
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles["GJ01AB4521"],
      serviceType: "Oil Change",
      cost: 2500,
      status: "Completed",
      date: daysAgo(20),
      closedAt: daysAgo(20),
    },
  });
  await prisma.maintenanceLog.create({
    data: {
      vehicleId: vehicles["GJ02GH7788"],
      serviceType: "Brake Service",
      cost: 7400,
      status: "Completed",
      date: daysAgo(30),
      closedAt: daysAgo(29),
    },
  });

  console.log("Seeding fuel logs...");
  const fuel = [
    { reg: "GJ01AB9985", trip: "TR002", liters: 26, cost: 2100, date: daysAgo(5) },
    { reg: "GJ01AB7777", trip: "TR005", liters: 13, cost: 1050, date: daysAgo(8) },
    { reg: "GJ04CD5567", trip: "TR008", liters: 34, cost: 2750, date: daysAgo(13) },
    { reg: "GJ06KL9900", trip: "TR010", liters: 6, cost: 480, date: daysAgo(19) },
    { reg: "GJ01AB4521", trip: null, liters: 42, cost: 3150, date: daysAgo(3) },
    { reg: "GJ05EF3321", trip: null, liters: 28, cost: 2050, date: daysAgo(4) },
    { reg: "GJ02GH7788", trip: null, liters: 55, cost: 4300, date: daysAgo(7) },
  ];
  const tripCodeToId: Record<string, string> = {};
  for (const code of ["TR002", "TR005", "TR008", "TR010"]) {
    const tr = await prisma.trip.findUnique({ where: { tripCode: code } });
    if (tr) tripCodeToId[code] = tr.id;
  }
  for (const f of fuel) {
    await prisma.fuelLog.create({
      data: {
        vehicleId: vehicles[f.reg],
        tripId: f.trip ? tripCodeToId[f.trip] : null,
        liters: f.liters,
        cost: f.cost,
        date: f.date,
      },
    });
  }

  console.log("Seeding expenses...");
  await prisma.expense.create({
    data: {
      type: "Toll",
      amount: 340,
      description: "NH-48 tolls",
      vehicleId: vehicles["GJ01AB9985"],
      tripId: tripCodeToId["TR002"],
      date: daysAgo(5),
    },
  });
  await prisma.expense.create({
    data: {
      type: "Misc",
      amount: 150,
      description: "Loading charges",
      vehicleId: vehicles["GJ01AB9985"],
      tripId: tripCodeToId["TR002"],
      date: daysAgo(5),
    },
  });
  await prisma.expense.create({
    data: {
      type: "Toll",
      amount: 120,
      description: "City toll",
      vehicleId: vehicles["GJ01AB4521"],
      date: daysAgo(1),
    },
  });
  await prisma.expense.create({
    data: {
      type: "Toll",
      amount: 300,
      description: "Expressway",
      vehicleId: vehicles["GJ04CD5567"],
      tripId: tripCodeToId["TR008"],
      date: daysAgo(13),
    },
  });
  await prisma.expense.create({
    data: {
      type: "Parking",
      amount: 80,
      description: "Depot parking",
      vehicleId: vehicles["GJ01AB7777"],
      date: daysAgo(8),
    },
  });

  console.log("Seeding vehicle documents...");
  await prisma.vehicleDocument.create({
    data: {
      vehicleId: vehicles["GJ01AB4521"],
      name: "Insurance",
      type: "Insurance",
      number: "INS-2024-4521",
      expiryDate: days(120),
    },
  });
  await prisma.vehicleDocument.create({
    data: {
      vehicleId: vehicles["GJ01AB4521"],
      name: "PUC Certificate",
      type: "PUC",
      number: "PUC-778812",
      expiryDate: days(15),
    },
  });
  await prisma.vehicleDocument.create({
    data: {
      vehicleId: vehicles["GJ01AB9985"],
      name: "National Permit",
      type: "Permit",
      number: "NP-9985",
      expiryDate: days(300),
    },
  });

  console.log("Seeding settings...");
  await prisma.setting.create({
    data: {
      id: "global",
      depotName: "Gandhinagar Depot GJ-14",
      currency: "INR",
      distanceUnit: "Kilometers",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
