# Tool Tracker

Tool inventory and custody tracking for teams that check tools in and out to customers. Built with Next.js 15, PostgreSQL, Drizzle ORM, and Auth.js.

## Features

- **Authentication** — Email/password login with `admin` and `user` roles
- **Dashboard** — Tool counts, overdue checkouts, recent activity, admin shortcuts
- **Check in / out** — Search and filter tools, assign to customers, notes, expected return dates
- **Tools by customer** — Customers who currently have tools checked out, with tool details
- **History** — Full audit log with filters; admins can delete records
- **Overdue reminders** — In-app banner on every page when tools are past their expected return date (visible to all users)
- **Admin**
  - Tools CRUD (inventory fields, status)
  - Customers CRUD (employee ID, name, specialization)
  - User management (create/edit accounts, roles, active status)

## View live demo

[**View Live Demo**](https://tooltracker-demo.vercel.app)

| Role  | Email           | Password |
| ----- | --------------- | -------- |
| Admin | admin@admin.com | admin123 |
| User  | user@user.com   | user123  |

First load after idle may take a few seconds while Vercel and Neon wake.

## Tech stack

| Layer     | Technology                            |
| --------- | ------------------------------------- |
| Framework | Next.js 15 (App Router)               |
| Database  | PostgreSQL 18                         |
| ORM       | Drizzle                               |
| Auth      | Auth.js v5 (credentials)              |
| UI        | Tailwind CSS, shadcn/ui, Lucide icons |
| Toasts    | Sonner                                |

## Prerequisites

- Node.js 20+
- Docker Desktop (local Postgres or full production stack)
- PostgreSQL connection string for cloud deploys

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://tooltracker:tooltracker@localhost:5433/tooltracker
AUTH_SECRET=your-long-random-secret
AUTH_URL=http://localhost:3000

# Optional — first admin (run once)
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=admin123
SEED_ADMIN_NAME=System Admin
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres on port **5433** (see `docker-compose.yml`).

### 4. Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your seeded admin account.

### Optional: Drizzle Studio

```bash
npm run db:studio
```

## Application routes

| Route                | Access    | Description                   |
| -------------------- | --------- | ----------------------------- |
| `/login`             | Public    | Sign in                       |
| `/dashboard`         | All users | Overview and recent activity  |
| `/operations`        | All users | Check tools in and out        |
| `/tools-by-customer` | All users | Customers with open checkouts |
| `/history`           | All users | Checkout audit log            |
| `/admin/tools`       | Admin     | Manage tool inventory         |
| `/admin/customers`   | Admin     | Manage customers              |
| `/admin/users`       | Admin     | Manage user accounts          |

## Roles

| Role      | Permissions                                                    |
| --------- | -------------------------------------------------------------- |
| **user**  | Dashboard, operations, tools by customer, history (view)       |
| **admin** | Everything above + admin CRUD, history delete, user management |

## Business rules

- One physical tool per row; `local_id` is the primary key
- Checkout is tied to a predefined customer
- Any logged-in user can check tools in or out
- Checkout notes live on the log; check-in appends `Check-in: {text}`
- **Delete tool** — blocked only while the tool is checked out
- **Delete customer** — blocked only while they have a tool checked out
- Deleting a tool or customer also removes their closed checkout history (FK constraint)

## Scripts

| Script                    | Description                                  |
| ------------------------- | -------------------------------------------- |
| `npm run dev`             | Development server (Turbopack)               |
| `npm run build`           | Production build                             |
| `npm run start`           | Start production server                      |
| `npm run lint`            | ESLint                                       |
| `npm run db:generate`     | Generate migration from schema changes       |
| `npm run db:migrate`      | Apply migrations (local / Drizzle Kit)       |
| `npm run db:migrate:prod` | Apply migrations (runtime / Docker / Render) |
| `npm run db:studio`       | Open Drizzle Studio                          |
| `npm run db:seed`         | Create first admin user                      |

## Deploy on Vercel (app) + Render (database)

A common setup: host the Next.js app on **Vercel** and Postgres on **Render**.

### Render — PostgreSQL

1. Create a PostgreSQL database on Render
2. Copy the **External Database URL**

### Vercel — Web app

1. Import the Git repository into Vercel
2. Set environment variables:

| Variable       | Value                                               |
| -------------- | --------------------------------------------------- |
| `DATABASE_URL` | Render Postgres connection string                   |
| `AUTH_SECRET`  | Random secret (`openssl rand -base64 32`)           |
| `AUTH_URL`     | Your Vercel URL, e.g. `https://your-app.vercel.app` |

3. Deploy, then run migrations against the production database (from your machine or CI):

```bash
 DATABASE_URL="your-render-url" npm run db:migrate:prod
 npm run db:seed   # first admin only, with SEED_* vars set
```

## Deploy on Render (full stack)

The repo includes a `render.yaml` Blueprint for app + database on Render.

1. Connect the repository in Render and create a **Blueprint** from `render.yaml`
2. After the first deploy, set `AUTH_URL` to your service URL (e.g. `https://tooltracker.onrender.com`)
3. Run seed once if needed:

```bash
 SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... SEED_ADMIN_NAME=... npm run db:seed
```

Migrations run automatically during the Render build (`npm run db:migrate:prod`).

## Production Docker (on-prem / client device)

For a self-hosted install with Docker on a local machine or server:

### 1. Configure environment

Create `.env` next to `docker-compose.prod.yml`:

```env
AUTH_SECRET=your-long-random-secret
AUTH_URL=http://localhost:3000
```

Use the machine's LAN IP or domain in `AUTH_URL` if accessed from other devices.

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This starts:

- **postgres** — PostgreSQL 18 with persistent volume
- **app** — Next.js on port **3000** (runs migrations on startup)

### 3. Seed admin (first time)

```bash
docker compose -f docker-compose.prod.yml exec app sh -c \
  'SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=changeme SEED_ADMIN_NAME=Admin npm run db:seed'
```

Open [http://localhost:3000](http://localhost:3000).

### Local dev vs production Docker

| File                      | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `docker-compose.yml`      | Postgres only for local development        |
| `docker-compose.prod.yml` | Full stack (Postgres + app) for production |
| `Dockerfile`              | Production image for the Next.js app       |

## Schema changes

After editing `src/db/schema.ts`:

```bash
npm run db:generate
npm run db:migrate
```

Commit the new files under `drizzle/migrations/`.

## Project structure

```
src/
  app/              # Pages and routes
  actions/          # Server actions (data + mutations)
  components/       # UI components
  db/               # Schema, migrations runner, seed
  lib/              # Auth, validations, utilities
drizzle/migrations/ # SQL migrations
```

## License

Private — client project.
