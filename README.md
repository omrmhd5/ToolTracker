# Tool Tracker

Tool inventory and custody tracking system built with Next.js, PostgreSQL, and Drizzle ORM.

## Prerequisites

- Node.js 20+
- Docker Desktop (for local PostgreSQL) **or** a running PostgreSQL instance

## Local setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
```

3. **Start PostgreSQL**

```bash
docker compose up -d
```

4. **Run migrations and seed admin**

```bash
npm run db:generate   # only needed after schema changes
npm run db:migrate
npm run db:seed
```

5. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in with the seeded admin credentials from `.env`.

Default seed credentials (from `.env.example`):

- Email: `admin@tooltracker.local`
- Password: `admin123`

6. **Browse the database (optional)**

```bash
npm run db:studio
```

## Project status

**Increment 1 (Foundation)** — complete

- Next.js 15 + TypeScript + Tailwind
- Drizzle schema for `users`, `customers`, `tools`, `checkout_logs`
- Docker Compose for Postgres 18
- Sidebar layout shell with placeholder pages

**Increment 2 (Auth)** — complete

- Auth.js credentials login at `/login`
- Middleware: auth required, `/admin` admin-only
- Seed script for first admin (`npm run db:seed`)
- Admin user management at `/admin/users`

**Increment 3 (Master data)** — complete

- Admin customer CRUD at `/admin/customers` (employee ID, name, specialization)
- Admin tools CRUD at `/admin/tools` (all inventory fields, filters by status/location)

Upcoming increments: checkout flows, search, dashboard, polish.

## Scripts

| Script                | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Start development server       |
| `npm run build`       | Production build               |
| `npm run db:generate` | Generate migration from schema |
| `npm run db:migrate`  | Apply migrations               |
| `npm run db:studio`   | Open Drizzle Studio            |
| `npm run db:seed`     | Seed admin user (Increment 2)  |
