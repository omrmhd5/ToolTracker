"use server";

import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkoutLogs, customers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { revalidateCustomerData } from "@/lib/revalidate-app";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "@/lib/validations/customer";
import type { ActionResult } from "@/lib/utils";

const PAGE_SIZE = 20;

export async function getCustomers(filters?: { q?: string; page?: number }) {
  await requireAdmin();

  const page = Math.max(1, filters?.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const conditions = [];

  if (filters?.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    const searchCondition = or(
      ilike(customers.employeeId, pattern),
      ilike(customers.name, pattern),
      ilike(customers.specialization, pattern),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers);

  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = whereClause
    ? await db
        .select({
          id: customers.id,
          employeeId: customers.employeeId,
          name: customers.name,
          specialization: customers.specialization,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .where(whereClause)
        .orderBy(customers.name)
        .limit(PAGE_SIZE)
        .offset(offset)
    : await db
        .select({
          id: customers.id,
          employeeId: customers.employeeId,
          name: customers.name,
          specialization: customers.specialization,
          createdAt: customers.createdAt,
        })
        .from(customers)
        .orderBy(customers.name)
        .limit(PAGE_SIZE)
        .offset(offset);

  return {
    customers: rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
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

  revalidateCustomerData();

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

  revalidateCustomerData();

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

  revalidateCustomerData();

  return { success: true };
}
