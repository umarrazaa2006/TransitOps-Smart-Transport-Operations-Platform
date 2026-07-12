# TransitOps - Smart Transport Operations Platform

TransitOps is an end-to-end transport operations platform that digitizes the full lifecycle of a logistics fleet: vehicle registry, driver management, trip dispatching, maintenance, fuel and expense tracking, and operational analytics - all with role-based access control and enforced business rules.

Built for the TransitOps hackathon brief. It replaces spreadsheets and manual logbooks with a single, real-time, rule-driven system.

---

## Table of Contents

- [Highlights](#highlights)
- [Feature Coverage](#feature-coverage)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)
- [NPM Scripts](#npm-scripts)
- [Database Model](#database-model)
- [API Reference](#api-reference)
- [Role-Based Access Control](#role-based-access-control)
- [Business Rules Enforced](#business-rules-enforced)
- [Example Workflow](#example-workflow)
- [Switching to PostgreSQL](#switching-to-postgresql-neon--supabase)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project Structure](#project-structure)
- [Notes and Design Decisions](#notes-and-design-decisions)

---

## Highlights

- Secure email + password authentication with signed JWT sessions in HTTP-only cookies.
- Role-Based Access Control enforced in three layers: edge middleware, every API route, and the UI.
- Automatic status transitions for vehicles, drivers and trips, wrapped in database transactions.
- All mandatory business rules validated on the server (never trust the client).
- Live dashboard with KPIs, filters and charts; analytics with Fuel Efficiency, Fleet Utilization, Operational Cost and Vehicle ROI.
- CSV export (client and server), responsive layout, and dark mode by default.
- Zero-config local setup using SQLite; one-line switch to PostgreSQL for production.

## Feature Coverage

Mandatory deliverables:

- Responsive web interface (mobile to desktop).
- Authentication with RBAC (4 operational roles + admin).
- CRUD for Vehicles and Drivers (create, read, update, delete).
- Trip management with validations and the Draft to Dispatched to Completed / Cancelled lifecycle.
- Automatic status transitions on dispatch, complete, cancel and maintenance.
- Maintenance workflow (active record moves a vehicle to In Shop).
- Fuel and expense tracking with automatic operational cost.
- Dashboard with KPIs.

Bonus features implemented:

- Charts and visual analytics (Recharts).
- CSV export for vehicles, drivers, fuel/expenses and the analytics report.
- Search, filters and column sorting across registries.
- Dark mode (with a light theme toggle).
- Vehicle document management (data model + seed; insurance / PUC / permit with expiry).

Not implemented (time-boxed): PDF export and outbound email reminders. License expiry is surfaced visually on the Drivers page (Expired / Expiring badges) instead of by email.

## Tech Stack

| Layer      | Choice                                   | Why                                                                  |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19       | Server + client in one codebase, file-based routing, edge middleware |
| Language   | TypeScript (strict)                      | Type safety across API and UI                                        |
| Styling    | Tailwind CSS v3 + custom shadcn-style UI | Fast, consistent, themeable design system                            |
| Charts     | Recharts                                 | Declarative, responsive analytics charts                             |
| ORM        | Prisma 6                                 | Type-safe database access and migrations                             |
| Database   | SQLite (dev) / PostgreSQL (prod)         | Zero-config locally, production-ready when needed                    |
| Auth       | Custom JWT via jose + bcryptjs           | Full control over sessions and RBAC, no external service             |
| Validation | Zod                                      | Runtime validation of every request body                             |
| Icons      | lucide-react                             | Clean, consistent icon set                                           |

> Note: The brief suggested NextAuth. A lightweight custom JWT layer was chosen instead for full control over the RBAC model and to keep the app running with zero external configuration. Swapping in NextAuth later is straightforward because auth is isolated in `src/lib/session.ts` and `src/lib/auth.ts`.

## Architecture

- The browser talks to Next.js Route Handlers under `src/app/api/*`. Each handler authorizes the request, validates input with Zod, runs Prisma queries (transactions where multiple rows change), and returns JSON.
- Edge middleware (`src/middleware.ts`) guards every page: unauthenticated users are redirected to `/login`, and users without permission for a section are redirected to `/dashboard`.
- Sessions are stateless JWTs signed with `AUTH_SECRET` and stored in an HTTP-only cookie. The same token is verified in middleware (edge) and in route handlers (node).
- The UI is a set of client components that fetch from the API via a small `useApi` hook and mutate via `apiSend`. Shared UI primitives live in `src/components/ui`.
- Business logic that must never be bypassed (dispatch validation, status reconciliation) lives in `src/lib` and is only invoked server-side.

## Getting Started

Prerequisites: Node.js 18.18+ (tested on Node 22) and npm.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. Create the local SQLite database and load demo data
npm run db:reset

# 3. Launch the app in development
npm run dev
```

Then open http://localhost:3000 and sign in with any demo account below.

The repository ships with a working `.env` (SQLite + a dev auth secret) so the app runs immediately. For production, copy `.env.example` and set your own values.

To run a production build locally:

```bash
npm run build
npm run start
```

> When serving the production build over plain http://localhost, the session cookie is marked `Secure` and will not be returned by the browser over HTTP. Use `npm run dev` for local testing, or serve over HTTPS. This works correctly on Vercel (HTTPS).

## Demo Accounts

All demo users share the password: `password123`

| Role              | Email                  | Can access                                              |
| ----------------- | ---------------------- | ------------------------------------------------------- |
| Fleet Manager     | fleet@transitops.in    | Fleet, Drivers, Maintenance, Analytics (view), Settings |
| Dispatcher        | dispatch@transitops.in | Dashboard, Trips (manage), Fleet + Drivers (view)       |
| Safety Officer    | safety@transitops.in   | Drivers (manage), Trips (view), Dashboard               |
| Financial Analyst | finance@transitops.in  | Fuel & Expenses (manage), Analytics, Fleet (view)       |
| Administrator     | admin@transitops.in    | Everything                                              |

Tip: On the login screen, pick a role from the dropdown to auto-fill that account.

## Environment Variables

| Variable     | Required | Description                                                                                              |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| DATABASE_URL | Yes      | Prisma connection string. Default `file:./dev.db` (SQLite). For PostgreSQL use a `postgresql://...` URL. |
| AUTH_SECRET  | Yes      | Secret used to sign session JWTs. Use a long random string in production.                                |

## NPM Scripts

| Script            | Description                                     |
| ----------------- | ----------------------------------------------- |
| npm run dev       | Start the development app                       |
| npm run build     | Generate Prisma client and build for production |
| npm run start     | Run the production build (after build)          |
| npm run db:push   | Sync the Prisma schema to the database          |
| npm run db:seed   | Load demo data                                  |
| npm run db:reset  | Force-reset the schema and reload demo data     |
| npm run db:studio | Open Prisma Studio                              |
| npm run lint      | Run ESLint                                      |
| npm run format    | Format the codebase with Prettier               |

## Switching to PostgreSQL (Neon / Supabase)

The schema uses plain string status fields (not native enums), so it is portable across SQLite and PostgreSQL with no model changes.

1. Create a free database on Neon or Supabase and copy the connection string.
2. In `prisma/schema.prisma`, change the datasource provider to `postgresql`:

```prisma
datasource db {
 provider = "postgresql"
 url = env("DATABASE_URL")
}
```

3. Set `DATABASE_URL` in `.env` to your PostgreSQL URL, for example:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/transitops?sslmode=require"
```

4. Recreate the schema and seed: `npm run db:reset`

> Provide the connection string and I can wire it up. Neon is recommended for serverless (Vercel) deployments.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Switch Prisma to `postgresql` (see above) and attach a PostgreSQL database (the Neon integration is easiest).
4. Set the environment variables in Vercel: `DATABASE_URL` and `AUTH_SECRET`.
5. The `build` script runs `prisma generate` automatically. After the first deploy, run `npx prisma db push` and `npx prisma db seed` against the production database.

## Database Model

Entities (Prisma models in `prisma/schema.prisma`):

- User: id, name, email (unique), passwordHash, role, timestamps.
- Vehicle: id, registrationNumber (unique), name, type, maxLoadCapacity, odometer, acquisitionCost, status, region, timestamps.
- Driver: id, name, licenseNumber (unique), licenseCategory, licenseExpiry, contactNumber, safetyScore, status, region, timestamps.
- Trip: id, tripCode (unique), source, destination, vehicleId, driverId, cargoWeight, plannedDistance, status, startOdometer, endOdometer, fuelConsumed, revenue, region, dispatchedAt, completedAt, cancelledAt, timestamps.
- MaintenanceLog: id, vehicleId, serviceType, cost, date, status, notes, closedAt, timestamps.
- FuelLog: id, vehicleId, tripId, liters, cost, odometer, date.
- Expense: id, type, amount, description, date, vehicleId, tripId.
- VehicleDocument: id, vehicleId, name, type, number, expiryDate.
- Setting: id, depotName, currency, distanceUnit.

Relationships:

- A Vehicle has many Trips, MaintenanceLogs, FuelLogs, Expenses and VehicleDocuments.
- A Driver has many Trips.
- A Trip belongs to an optional Vehicle and optional Driver, and has many FuelLogs and Expenses.

Status values (stored as strings, validated by Zod and TypeScript constants in `src/lib/constants.ts`):

- Vehicle: Available, On Trip, In Shop, Retired.
- Driver: Available, On Trip, Off Duty, Suspended.
- Trip: Draft, Dispatched, Completed, Cancelled.
- Maintenance: Active, Completed.

## API Reference

All endpoints require a valid session cookie. Access level is enforced per role.

| Method | Endpoint              | Access             | Description                                                                  |
| ------ | --------------------- | ------------------ | ---------------------------------------------------------------------------- |
| POST   | /api/auth/login       | public             | Authenticate and set the session cookie                                      |
| POST   | /api/auth/logout      | any                | Clear the session cookie                                                     |
| GET    | /api/auth/me          | any                | Current user from the session                                                |
| GET    | /api/dashboard        | dashboard:view     | KPIs, vehicle status breakdown, recent trips (filters: type, status, region) |
| GET    | /api/vehicles         | fleet:view         | List vehicles (filters: status, type, region, q, available=1)                |
| POST   | /api/vehicles         | fleet:manage       | Create a vehicle (unique registration)                                       |
| GET    | /api/vehicles/[id]    | fleet:view         | Vehicle detail with cost breakdown                                           |
| PATCH  | /api/vehicles/[id]    | fleet:manage       | Update a vehicle                                                             |
| DELETE | /api/vehicles/[id]    | fleet:manage       | Delete a vehicle                                                             |
| GET    | /api/drivers          | drivers:view       | List drivers (filters: status, q, available=1)                               |
| POST   | /api/drivers          | drivers:manage     | Create a driver (unique license)                                             |
| PATCH  | /api/drivers/[id]     | drivers:manage     | Update a driver                                                              |
| DELETE | /api/drivers/[id]     | drivers:manage     | Delete a driver                                                              |
| GET    | /api/trips            | trips:view         | List trips with vehicle and driver                                           |
| POST   | /api/trips            | trips:manage       | Create a trip (action: draft or dispatch)                                    |
| PATCH  | /api/trips/[id]       | trips:manage       | Edit a draft, or transition (action: dispatch, complete, cancel)             |
| DELETE | /api/trips/[id]       | trips:manage       | Delete a trip (releases vehicle/driver if dispatched)                        |
| GET    | /api/maintenance      | maintenance:view   | List service records                                                         |
| POST   | /api/maintenance      | maintenance:manage | Create a record (Active moves vehicle to In Shop)                            |
| PATCH  | /api/maintenance/[id] | maintenance:manage | Close or reopen a record                                                     |
| DELETE | /api/maintenance/[id] | maintenance:manage | Delete a record and reconcile vehicle status                                 |
| GET    | /api/fuel             | expenses:view      | List fuel logs                                                               |
| POST   | /api/fuel             | expenses:manage    | Add a fuel log                                                               |
| DELETE | /api/fuel/[id]        | expenses:manage    | Delete a fuel log                                                            |
| GET    | /api/expenses         | expenses:view      | List expenses                                                                |
| POST   | /api/expenses         | expenses:manage    | Add an expense                                                               |
| DELETE | /api/expenses/[id]    | expenses:manage    | Delete an expense                                                            |
| GET    | /api/analytics        | analytics:view     | Analytics summary, monthly revenue, per-vehicle table (format=csv for CSV)   |
| GET    | /api/settings         | settings:view      | Read depot settings                                                          |
| PATCH  | /api/settings         | settings:manage    | Update depot settings                                                        |

## Role-Based Access Control

Access levels are none, view, or manage. Defined in `src/lib/rbac.ts` and enforced in middleware, API routes and UI.

| Role              | Dashboard | Fleet  | Drivers | Trips  | Maintenance | Fuel/Exp | Analytics | Settings |
| ----------------- | --------- | ------ | ------- | ------ | ----------- | -------- | --------- | -------- |
| Fleet Manager     | view      | manage | manage  | view   | manage      | view     | view      | manage   |
| Dispatcher        | view      | view   | view    | manage | none        | none     | none      | view     |
| Safety Officer    | view      | none   | manage  | view   | none        | none     | none      | view     |
| Financial Analyst | view      | view   | none    | none   | view        | manage   | manage    | view     |
| Administrator     | manage    | manage | manage  | manage | manage      | manage   | manage    | manage   |

## Business Rules Enforced

Every rule below is enforced server-side (in API routes and `src/lib/trips.ts` / `src/lib/maintenance.ts`), inside database transactions where multiple records change:

- Vehicle registration number is unique (database constraint + friendly 409 error).
- Retired or In Shop vehicles never appear in the dispatch selection (available=1 filter returns only Available vehicles).
- Drivers with an expired license or Suspended status cannot be assigned to a trip.
- A vehicle or driver already On Trip cannot be assigned to another trip.
- Cargo weight cannot exceed the vehicle maximum load capacity.
- Dispatching a trip sets both the vehicle and driver to On Trip and records the start odometer.
- Completing a trip sets both back to Available, updates the vehicle odometer, and records fuel.
- Cancelling a dispatched trip restores the vehicle and driver to Available.
- Creating an active maintenance record moves the vehicle to In Shop.
- Closing maintenance restores the vehicle to Available (unless it is Retired).

## Example Workflow

This mirrors the brief and can be reproduced in the UI:

1. Fleet: register vehicle Van-05 with capacity 500 kg (status Available).
2. Drivers: register driver Alex with a valid license.
3. Trips: create a trip with cargo weight 450 kg.
4. The system validates 450 <= 500 and enables Dispatch.
5. On dispatch, the vehicle and driver become On Trip automatically.
6. Complete the trip by entering the final odometer and fuel consumed.
7. The system marks the vehicle and driver Available again.
8. Maintenance: create an Oil Change record; the vehicle becomes In Shop and is hidden from dispatch.
9. Analytics updates operational cost and fuel efficiency from the latest trip and fuel log.

## Project Structure

```text
prisma/ Prisma schema and seed script
src/app/ Next.js App Router
src/app/(auth)/login Login page
src/app/(app)/ Protected pages (dashboard, fleet, drivers, trips, maintenance, expenses, analytics, settings)
src/app/api/ Route handlers (REST-style JSON API)
src/components/ui/ Reusable UI primitives (button, card, table, dialog, etc.)
src/components/layout/ App shell, sidebar, topbar, contexts
src/components/features/ Feature forms and widgets
src/lib/ Prisma client, auth/session, rbac, validation helpers, business logic
src/hooks/ Client data-fetching hooks
src/middleware.ts Auth + RBAC route protection
```

## Notes and Design Decisions

- SQLite is used for a frictionless demo; the schema is written to be PostgreSQL-ready with a single provider change.
- Statuses are strings (not native enums) for cross-database portability; they are validated everywhere with Zod and shared TypeScript constants.
- Auth is a small custom JWT layer (jose + bcryptjs) for full control and zero external dependencies; it can be replaced by NextAuth without touching the rest of the app.
- All mutations that change more than one row use Prisma transactions so status transitions cannot half-apply.
- The UI defaults to dark mode to match the design; a theme toggle is available in the top bar.

---

Built with care for the TransitOps hackathon.
