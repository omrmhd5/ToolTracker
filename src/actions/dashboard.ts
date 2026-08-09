"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { checkoutLogs, customers, tools, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";

export async function getDashboardStats() {
  await requireAuth();

  const [toolStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      inStock: sql<number>`count(*) filter (where ${tools.status} = 'IN')::int`,
      checkedOut: sql<number>`count(*) filter (where ${tools.status} = 'OUT')::int`,
    })
    .from(tools);

  const [overdueStats] = await db
    .select({
      overdue: sql<number>`count(*)::int`,
    })
    .from(checkoutLogs)
    .where(
      and(
        isNull(checkoutLogs.checkedInAt),
        sql`${checkoutLogs.expectedReturnAt} < current_date`,
      ),
    );

  return {
    total: Number(toolStats?.total ?? 0),
    inStock: Number(toolStats?.inStock ?? 0),
    checkedOut: Number(toolStats?.checkedOut ?? 0),
    overdue: Number(overdueStats?.overdue ?? 0),
  };
}

export async function getOverdueCheckouts() {
  await requireAuth();

  return db
    .select({
      logId: checkoutLogs.id,
      toolLocalId: tools.localId,
      serialNumber: tools.serialNumber,
      partNumber: tools.partNumber,
      commonName: tools.commonName,
      customerEmployeeId: customers.employeeId,
      customerName: customers.name,
      expectedReturnAt: checkoutLogs.expectedReturnAt,
      checkedOutAt: checkoutLogs.checkedOutAt,
    })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .innerJoin(customers, eq(checkoutLogs.customerId, customers.id))
    .where(
      and(
        isNull(checkoutLogs.checkedInAt),
        sql`${checkoutLogs.expectedReturnAt} < current_date`,
      ),
    )
    .orderBy(checkoutLogs.expectedReturnAt);
}

export type ActivityItem = {
  id: string;
  action: "CHECK_OUT" | "CHECK_IN";
  occurredAt: Date;
  toolLocalId: string;
  serialNumber: string;
  partNumber: string;
  customerEmployeeId: string;
  customerName: string;
  performedByName: string;
};

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  await requireAuth();

  const checkoutEvents = await db
    .select({
      id: checkoutLogs.id,
      occurredAt: checkoutLogs.checkedOutAt,
      toolLocalId: tools.localId,
      serialNumber: tools.serialNumber,
      partNumber: tools.partNumber,
      customerEmployeeId: customers.employeeId,
      customerName: customers.name,
      performedByName: users.name,
    })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .innerJoin(customers, eq(checkoutLogs.customerId, customers.id))
    .innerJoin(users, eq(checkoutLogs.checkedOutBy, users.id))
    .orderBy(desc(checkoutLogs.checkedOutAt))
    .limit(limit);

  const checkinEvents = await db
    .select({
      id: checkoutLogs.id,
      occurredAt: checkoutLogs.checkedInAt,
      toolLocalId: tools.localId,
      serialNumber: tools.serialNumber,
      partNumber: tools.partNumber,
      customerEmployeeId: customers.employeeId,
      customerName: customers.name,
      performedByName: users.name,
    })
    .from(checkoutLogs)
    .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
    .innerJoin(customers, eq(checkoutLogs.customerId, customers.id))
    .innerJoin(users, eq(checkoutLogs.checkedInBy, users.id))
    .where(sql`${checkoutLogs.checkedInAt} is not null`)
    .orderBy(desc(checkoutLogs.checkedInAt))
    .limit(limit);

  const merged: ActivityItem[] = [
    ...checkoutEvents.map((event) => ({
      id: `${event.id}-out`,
      action: "CHECK_OUT" as const,
      occurredAt: event.occurredAt,
      toolLocalId: event.toolLocalId,
      serialNumber: event.serialNumber,
      partNumber: event.partNumber,
      customerEmployeeId: event.customerEmployeeId,
      customerName: event.customerName,
      performedByName: event.performedByName,
    })),
    ...checkinEvents
      .filter((event) => event.occurredAt)
      .map((event) => ({
        id: `${event.id}-in`,
        action: "CHECK_IN" as const,
        occurredAt: event.occurredAt!,
        toolLocalId: event.toolLocalId,
        serialNumber: event.serialNumber,
        partNumber: event.partNumber,
        customerEmployeeId: event.customerEmployeeId,
        customerName: event.customerName,
        performedByName: event.performedByName,
      })),
  ];

  return merged
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, limit);
}
