"use server";

import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { checkoutLogs, customers, tools, users } from "@/db/schema";
import { requireAdmin, requireAuth } from "@/lib/auth-utils";
import { tError } from "@/lib/i18n";
import { revalidateHistoryData } from "@/lib/revalidate-app";
import type { ActionResult } from "@/lib/utils";

const PAGE_SIZE = 20;
const checkedInUser = alias(users, "checked_in_user");

function buildHistoryWhereClause(filters?: {
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
}) {
  const conditions = [];

  if (filters?.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(tools.localId, pattern),
        ilike(tools.serialNumber, pattern),
        ilike(tools.partNumber, pattern),
      ),
    );
  }

  if (filters?.customer?.trim()) {
    const pattern = `%${filters.customer.trim()}%`;
    conditions.push(
      or(ilike(customers.employeeId, pattern), ilike(customers.name, pattern)),
    );
  }

  if (filters?.from) {
    conditions.push(gte(checkoutLogs.checkedOutAt, new Date(filters.from)));
  }

  if (filters?.to) {
    const end = new Date(filters.to);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(checkoutLogs.checkedOutAt, end));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function needsToolJoinForHistory(filters?: {
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
}) {
  return Boolean(filters?.q?.trim());
}

function needsCustomerJoinForHistory(filters?: {
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
}) {
  return Boolean(filters?.customer?.trim());
}

function buildHistoryCountQuery(filters?: {
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
}) {
  const whereClause = buildHistoryWhereClause(filters);
  const needsTools = needsToolJoinForHistory(filters);
  const needsCustomers = needsCustomerJoinForHistory(filters);

  if (!needsTools && !needsCustomers) {
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkoutLogs);

    return whereClause ? countQuery.where(whereClause) : countQuery;
  }

  if (needsTools && !needsCustomers) {
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkoutLogs)
      .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId));

    return whereClause ? countQuery.where(whereClause) : countQuery;
  }

  if (!needsTools && needsCustomers) {
    const countQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkoutLogs)
      .innerJoin(customers, eq(checkoutLogs.customerId, customers.id));

    return whereClause ? countQuery.where(whereClause) : countQuery;
  }

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .innerJoin(customers, eq(checkoutLogs.customerId, customers.id));

  return whereClause ? countQuery.where(whereClause) : countQuery;
}

export async function getCheckoutHistory(filters?: {
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
  page?: number;
}) {
  await requireAuth();

  const page = Math.max(1, filters?.page ?? 1);
  const whereClause = buildHistoryWhereClause(filters);
  const offset = (page - 1) * PAGE_SIZE;

  const baseFrom = db
    .select({
      id: checkoutLogs.id,
      toolLocalId: tools.localId,
      serialNumber: tools.serialNumber,
      partNumber: tools.partNumber,
      customerEmployeeId: customers.employeeId,
      customerName: customers.name,
      checkedOutByName: users.name,
      checkedOutAt: checkoutLogs.checkedOutAt,
      expectedReturnAt: checkoutLogs.expectedReturnAt,
      checkedInAt: checkoutLogs.checkedInAt,
      checkedInByName: checkedInUser.name,
      notes: checkoutLogs.notes,
    })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .innerJoin(customers, eq(checkoutLogs.customerId, customers.id))
    .innerJoin(users, eq(checkoutLogs.checkedOutBy, users.id))
    .leftJoin(checkedInUser, eq(checkoutLogs.checkedInBy, checkedInUser.id));

  const countQuery = buildHistoryCountQuery(filters);

  const [countRow] = await countQuery;

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = whereClause
    ? await baseFrom
        .where(whereClause)
        .orderBy(desc(checkoutLogs.checkedOutAt))
        .limit(PAGE_SIZE)
        .offset(offset)
    : await baseFrom
        .orderBy(desc(checkoutLogs.checkedOutAt))
        .limit(PAGE_SIZE)
        .offset(offset);

  return {
    logs: rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

export type CheckoutHistoryRow = Awaited<
  ReturnType<typeof getCheckoutHistory>
>["logs"][number];

export async function deleteCheckoutLog(id: string): Promise<ActionResult> {
  await requireAdmin();

  const [log] = await db
    .select({
      id: checkoutLogs.id,
      toolLocalId: checkoutLogs.toolLocalId,
      checkedInAt: checkoutLogs.checkedInAt,
    })
    .from(checkoutLogs)
    .where(eq(checkoutLogs.id, id))
    .limit(1);

  if (!log) {
    return { success: false, error: await tError("errors.historyNotFound") };
  }

  await db.transaction(async (tx) => {
    await tx.delete(checkoutLogs).where(eq(checkoutLogs.id, id));

    if (!log.checkedInAt) {
      await tx
        .update(tools)
        .set({
          status: "IN",
          assignedqty: 0,
          updatedAt: new Date(),
        })
        .where(eq(tools.localId, log.toolLocalId));
    }
  });

  revalidateHistoryData();

  return { success: true };
}

export async function deleteAllCheckoutHistory(): Promise<ActionResult> {
  await requireAdmin();

  await db.transaction(async (tx) => {
    await tx
      .update(tools)
      .set({
        status: "IN",
        assignedqty: 0,
        updatedAt: new Date(),
      })
      .where(eq(tools.status, "OUT"));

    await tx.delete(checkoutLogs);
  });

  revalidateHistoryData();

  return { success: true };
}
