# Backend Changes Log (`BE-change.md`)

## Database Seeding & Startup Admin Bootstrapping

This document details the database seeding and admin employee auto-bootstrapping implementation, including **what** was changed, **which files** were affected, and **why**.

---

### Files Changed / Added

| File | Status | Description |
|---|---|---|
| [`prisma/seed.js`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/prisma/seed.js) | **NEW** | Standalone database seeding script executed via CLI (`npm run seed`). |
| [`src/modules/employees/employee.seed.js`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/src/modules/employees/employee.seed.js) | **NEW** | Module containing [`ensureAdminEmployee()`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/src/modules/employees/employee.seed.js#L8-L51) with upsert & collision fallback logic. |
| [`src/index.js`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/src/index.js) | **MODIFIED** | Server bootstrap entry point; runs `ensureAdminEmployee()` during startup. |
| [`package.json`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/package.json) | **MODIFIED** | Added seed scripts and configured Prisma's seed runner. |

---

### What Was Changed

1. **Created `ensureAdminEmployee()` ([`src/modules/employees/employee.seed.js`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/src/modules/employees/employee.seed.js))**:
   - Implemented an idempotent database upsert targeting the `Employee` table with `id: 'admin'`.
   - Populates default workshop owner credentials:
     - `id`: `'admin'`
     - `name`: `'Workshop Owner'`
     - `phone`: `'+919825272547'`
     - `role`: `'OWNER'`
     - `isActive`: `true`
   - Included fallback error handling for Prisma error code `P2002` (unique constraint collision on phone number) by generating a fallback timestamped phone identifier to ensure the admin record is always created.

2. **Automated Startup Bootstrapping ([`src/index.js`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/src/index.js#L9-L15))**:
   - Before binding to `PORT`, `startServer()` awaits `ensureAdminEmployee()`.
   - Logs `👤 Admin employee ensured in database` on success, or logs a warning if bootstrapping encounters an issue without crashing server initialization.

3. **Standalone Seed Script ([`prisma/seed.js`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/prisma/seed.js))**:
   - Calls `ensureAdminEmployee()`.
   - Logs the ensured admin record details (`id`, `name`, `role`, `phone`, `isActive`).
   - Ensures clean lifecycle termination via `prisma.$disconnect()` on success or error.

4. **Added Scripts to [`package.json`](file:///s:/client-projects/Hindustan-Electricals/hindustan-motor-backend/package.json)**:
   ```json
   "scripts": {
     "prisma:seed": "node prisma/seed.js",
     "seed": "node prisma/seed.js"
   },
   "prisma": {
     "seed": "node prisma/seed.js"
   }
   ```

---

### Why (Problem & Solution)

1. **Foreign Key Integrity in Audit History:**
   - In PostgreSQL, the `History` table maintains a foreign key constraint: `actorEmployeeId` references `Employee(id)`.
   - Any admin operation (such as registering motors, assigning tasks, or updating job status) requires a valid referencing employee.
   - Without an existing employee record, actions triggered by the workshop owner / admin failed referential integrity checks.

2. **Zero-Touch Cloud Deployment:**
   - On hosting environments (e.g., Render, Railway) connected to managed databases (e.g., Neon PostgreSQL), databases start empty.
   - By running `ensureAdminEmployee()` automatically in `src/index.js` on startup, the required owner record is initialized immediately without requiring manual SQL commands or SSH terminal intervention.

3. **Idempotency & Safe Restarts:**
   - Using Prisma's `upsert` ensures that consecutive server restarts, deployments, or manual `npm run seed` runs never create duplicates or throw primary key conflicts.
