"use server";

import { and, eq, exists, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkoutLogs, customers, tools } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

const PAGE_SIZE = 10;

export async function getCustomersWithCheckedOutTools(filters?: {
  q?: string;
  page?: number;
}) {
  await requireAuth();

  const page = Math.max(1, filters?.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;
  const conditions = [
    exists(
      db
        .select({ id: checkoutLogs.id })
        .from(checkoutLogs)
        .where(
          and(
            eq(checkoutLogs.customerId, customers.id),
            isNull(checkoutLogs.checkedInAt),
          ),
        ),
    ),
  ];

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

  const whereClause = and(...conditions);

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers);

  const [countRow] = await countQuery.where(whereClause);

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const customerRows = await db
    .select({
      id: customers.id,
      employeeId: customers.employeeId,
      name: customers.name,
      specialization: customers.specialization,
    })
    .from(customers)
    .where(whereClause)
    .orderBy(customers.name)
    .limit(PAGE_SIZE)
    .offset(offset);

  if (customerRows.length === 0) {
    return {
      customers: [],
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
    };
  }

  const customerIds = customerRows.map((customer) => customer.id);

  const openCheckouts = await db
    .select({
      customerId: checkoutLogs.customerId,
      checkoutLogId: checkoutLogs.id,
      toolLocalId: tools.localId,
      serialNumber: tools.serialNumber,
      partNumber: tools.partNumber,
      commonName: tools.commonName,
      location: tools.location,
      subLocation: tools.subLocation,
      checkedOutAt: checkoutLogs.checkedOutAt,
      expectedReturnAt: checkoutLogs.expectedReturnAt,
      notes: checkoutLogs.notes,
    })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .where(
      and(
        inArray(checkoutLogs.customerId, customerIds),
        isNull(checkoutLogs.checkedInAt),
      ),
    )
    .orderBy(checkoutLogs.checkedOutAt);

  const toolsByCustomer = new Map<string, typeof openCheckouts>();

  for (const checkout of openCheckouts) {
    const existing = toolsByCustomer.get(checkout.customerId) ?? [];
    existing.push(checkout);
    toolsByCustomer.set(checkout.customerId, existing);
  }

  const customersWithTools = customerRows.map((customer) => ({
    ...customer,
    tools: toolsByCustomer.get(customer.id) ?? [],
  }));

  return {
    customers: customersWithTools,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

export type CustomerWithCheckedOutTools = Awaited<
  ReturnType<typeof getCustomersWithCheckedOutTools>
>["customers"][number];
