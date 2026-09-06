import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const needsSsl =
    process.env.NODE_ENV === "production" ||
    /neon\.tech|sslmode=require|render\.com/i.test(connectionString);

  const client = postgres(connectionString, {
    max: 1,
    ...(needsSsl ? { ssl: "require" as const } : {}),
  });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "drizzle/migrations" });
  await client.end();
}

runMigrations()
  .then(() => {
    console.log("Migrations applied");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
