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

4. **Run migrations**

```bash
npm run db:generate   # only needed after schema changes
npm run db:migrate
```

5. **Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the dashboard with the sidebar layout.

6. **Browse the database (optional)**

```bash
npm run db:studio
```

## Project status

**Increment 1 (Foundation)** — complete

- Next.js 15 + TypeScript + Tailwind
- Drizzle schema for `users`, `customers`, `tools`, `checkout_logs`
- Docker Compose for Postgres 16
- Sidebar layout shell with placeholder pages

Upcoming increments: auth, admin CRUD, checkout flows, search, dashboard, polish.

## Scripts

| Script                | Description                    |
| --------------------- | ------------------------------ |
| `npm run dev`         | Start development server       |
| `npm run build`       | Production build               |
| `npm run db:generate` | Generate migration from schema |
| `npm run db:migrate`  | Apply migrations               |
| `npm run db:studio`   | Open Drizzle Studio            |
| `npm run db:seed`     | Seed admin user (Increment 2)  |
