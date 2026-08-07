import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME;

  if (!email || !password || !name) {
    throw new Error("Missing SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, or SEED_ADMIN_NAME in environment");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    console.log(`Admin already exists: ${normalizedEmail}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(users).values({
    email: normalizedEmail,
    passwordHash,
    name,
    role: "admin",
    isActive: true,
  });

  console.log(`Admin created: ${normalizedEmail}`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
