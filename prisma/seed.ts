// TransitOps Prisma schema
// Uses SQLite for zero-config local dev. Switch provider to "postgresql" for Neon/Supabase.
// Statuses are stored as strings (portable across SQLite/Postgres) and validated in the app layer.

generator client {
 provider = "prisma-client-js"
}

datasource db {
 provider = "sqlite"
 url = env("DATABASE_URL")
}

model User {
 id String @id @default(cuid())
 name String
 email String @unique
 passwordHash String
 role String @default("DISPATCHER")
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt
}

model Vehicle {
 id String @id @default(cuid())
 registrationNumber String @unique
 name String
 type String
 maxLoadCapacity Float
 odometer Float @default(0)
 acquisitionCost Float @default(0)
 status String @default("Available")
 region String?
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt

 trips Trip[]
 maintenanceLogs MaintenanceLog[]
 fuelLogs FuelLog[]
 expenses Expense[]
 documents VehicleDocument[]
}

model Driver {
 id String @id @default(cuid())
 name String
 licenseNumber String @unique
 licenseCategory String
 licenseExpiry DateTime
 contactNumber String?
 safetyScore Int @default(100)
 status String @default("Available")
 region String?
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt

 trips Trip[]
}

model Trip {
 id String @id @default(cuid())
 tripCode String @unique
 source String
 destination String
 vehicleId String?
 driverId String?
 cargoWeight Float @default(0)
 plannedDistance Float @default(0)
 status String @default("Draft")
 startOdometer Float?
 endOdometer Float?
 fuelConsumed Float?
 revenue Float @default(0)
 region String?
 dispatchedAt DateTime?
 completedAt DateTime?
 cancelledAt DateTime?
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt

 vehicle Vehicle? @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
 driver Driver? @relation(fields: [driverId], references: [id], onDelete: SetNull)
 fuelLogs FuelLog[]
 expenses Expense[]
}

model MaintenanceLog {
 id String @id @default(cuid())
 vehicleId String
 serviceType String
 cost Float @default(0)
 date DateTime @default(now())
 status String @default("Active")
 notes String?
 closedAt DateTime?
 createdAt DateTime @default(now())
 updatedAt DateTime @updatedAt

 vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}

model FuelLog {
 id String @id @default(cuid())
 vehicleId String
 tripId String?
 liters Float
 cost Float
 odometer Float?
 date DateTime @default(now())
 createdAt DateTime @default(now())

 vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
 trip Trip? @relation(fields: [tripId], references: [id], onDelete: SetNull)
}

model Expense {
 id String @id @default(cuid())
 type String
 amount Float
 description String?
 date DateTime @default(now())
 vehicleId String?
 tripId String?
 createdAt DateTime @default(now())

 vehicle Vehicle? @relation(fields: [vehicleId], references: [id], onDelete: SetNull)
 trip Trip? @relation(fields: [tripId], references: [id], onDelete: SetNull)
}

model VehicleDocument {
 id String @id @default(cuid())
 vehicleId String
 name String
 type String
 number String?
 expiryDate DateTime?
 createdAt DateTime @default(now())

 vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
}

model Setting {
 id String @id @default("global")
 depotName String @default("Gandhinagar Depot GJ-14")
 currency String @default("INR")
 distanceUnit String @default("Kilometers")
 updatedAt DateTime @updatedAt
}
