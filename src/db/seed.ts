import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

type SeedUser = {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
};

async function seedUser({ email, password, name, role }: SeedUser) {
  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    console.log(`${role} already exists: ${normalizedEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email: normalizedEmail,
    passwordHash,
    name,
    role,
    isActive: true,
  });

  console.log(`${role} created: ${normalizedEmail}`);
}

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set, skipping seed");
    return;
  }

  const accounts: SeedUser[] = [
    {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@gmail.com",
      password: process.env.SEED_ADMIN_PASSWORD ?? "admin123",
      name: process.env.SEED_ADMIN_NAME ?? "System Admin",
      role: "admin",
    },
    {
      email: process.env.SEED_USER_EMAIL ?? "user@gmail.com",
      password: process.env.SEED_USER_PASSWORD ?? "user123",
      name: process.env.SEED_USER_NAME ?? "Standard User",
      role: "user",
    },
  ];

  for (const account of accounts) {
    if (!account.email || !account.password || !account.name) {
      throw new Error(`Missing seed credentials for ${account.role}`);
    }
    await seedUser(account);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
