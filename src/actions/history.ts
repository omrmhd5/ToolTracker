"use server";

import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { checkoutLogs, customers, tools, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

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

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .innerJoin(customers, eq(checkoutLogs.customerId, customers.id));

  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

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
