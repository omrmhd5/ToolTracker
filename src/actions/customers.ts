"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkoutLogs, customers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "@/lib/validations/customer";
import type { ActionResult } from "@/lib/utils";

export async function getCustomers() {
  await requireAdmin();

  return db.select().from(customers).orderBy(customers.name);
}

export async function createCustomer(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { employeeId, name, specialization } = parsed.data;
  const normalizedEmployeeId = employeeId.trim();

  const [existing] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.employeeId, normalizedEmployeeId))
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: "A customer with this employee ID already exists",
    };
  }

  const [created] = await db
    .insert(customers)
    .values({
      employeeId: normalizedEmployeeId,
      name: name.trim(),
      specialization: specialization.trim(),
    })
    .returning({ id: customers.id });

  revalidatePath("/admin/customers");

  return { success: true, data: { id: created.id } };
}

export async function updateCustomer(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { id, employeeId, name, specialization } = parsed.data;
  const normalizedEmployeeId = employeeId.trim();

  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  if (!existing) {
    return { success: false, error: "Customer not found" };
  }

  const [employeeIdTaken] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.employeeId, normalizedEmployeeId))
    .limit(1);

  if (employeeIdTaken && employeeIdTaken.id !== id) {
    return {
      success: false,
      error: "A customer with this employee ID already exists",
    };
  }

  await db
    .update(customers)
    .set({
      employeeId: normalizedEmployeeId,
      name: name.trim(),
      specialization: specialization.trim(),
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id));

  revalidatePath("/admin/customers");

  return { success: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  if (!existing) {
    return { success: false, error: "Customer not found" };
  }

  const [openCheckout] = await db
    .select({ id: checkoutLogs.id })
    .from(checkoutLogs)
    .where(
      and(eq(checkoutLogs.customerId, id), isNull(checkoutLogs.checkedInAt)),
    )
    .limit(1);

  if (openCheckout) {
    return {
      success: false,
      error:
        "Cannot delete a customer with a tool currently checked out. Check in the tool first.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(checkoutLogs).where(eq(checkoutLogs.customerId, id));
    await tx.delete(customers).where(eq(customers.id, id));
  });

  revalidatePath("/admin/customers");

  return { success: true };
}
