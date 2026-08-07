"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import type { ActionResult } from "@/lib/utils";

export async function getUsers() {
  await requireAdmin();

  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
}

export async function createUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, name, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return { success: false, error: "A user with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [created] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      name: name.trim(),
      role,
      isActive: true,
    })
    .returning({ id: users.id });

  revalidatePath("/admin/users");

  return { success: true, data: { id: created.id } };
}

export async function updateUser(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin();

  const parsed = updateUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, email, name, role, isActive, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) {
    return { success: false, error: "User not found" };
  }

  const [emailTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (emailTaken && emailTaken.id !== id) {
    return { success: false, error: "A user with this email already exists" };
  }

  if (id === session.user.id && !isActive) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  if (id === session.user.id && role !== "admin") {
    return { success: false, error: "You cannot remove your own admin role" };
  }

  const updates: {
    email: string;
    name: string;
    role: "admin" | "user";
    isActive: boolean;
    updatedAt: Date;
    passwordHash?: string;
  } = {
    email: normalizedEmail,
    name: name.trim(),
    role,
    isActive,
    updatedAt: new Date(),
  };

  if (password) {
    updates.passwordHash = await bcrypt.hash(password, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, id));

  revalidatePath("/admin/users");

  return { success: true };
}
