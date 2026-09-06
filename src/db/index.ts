import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

declare global {
  var __toolTrackerDb: Db | undefined;
  var __toolTrackerSql: ReturnType<typeof postgres> | undefined;
}

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const serverless =
    Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
  const needsSsl =
    process.env.NODE_ENV === "production" ||
    /neon\.tech|sslmode=require|render\.com/i.test(connectionString);

  const client = postgres(connectionString, {
    max: serverless ? 1 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ...(needsSsl ? { ssl: "require" as const } : {}),
  });

  return { client, database: drizzle(client, { schema }) };
}

function getDb() {
  if (globalThis.__toolTrackerDb) {
    return globalThis.__toolTrackerDb;
  }

  const { client, database } = createDb();
  globalThis.__toolTrackerSql = client;
  globalThis.__toolTrackerDb = database;
  return database;
}

export const db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    return Reflect.get(getDb(), property, receiver);
  },
});

export type Database = Db;
