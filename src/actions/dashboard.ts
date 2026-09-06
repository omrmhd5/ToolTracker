"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { checkoutLogs, customers, tools, users } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { DUE_SOON_DAYS } from "@/lib/dashboard-constants";

const OVERDUE_PREVIEW_LIMIT = 3;
const DASHBOARD_OVERDUE_LIMIT = 20;
const DASHBOARD_DUE_SOON_LIMIT = 10;
const TOP_CUSTOMERS_LIMIT = 5;

function dueSoonFilter() {
  // Use a literal day offset — Postgres date + integer works, but not date + bound param.
  const dueSoonEnd = sql.raw(`current_date + ${DUE_SOON_DAYS}`);

  return and(
    isNull(checkoutLogs.checkedInAt),
    sql`${checkoutLogs.expectedReturnAt} >= current_date`,
    sql`${checkoutLogs.expectedReturnAt} <= ${dueSoonEnd}`,
  );
}

const getCachedDashboardStats = unstable_cache(
  async () => {
    const [toolStats, overdueStats, dueSoonStats] = await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          inStock: sql<number>`count(*) filter (where ${tools.status} = 'IN')::int`,
          checkedOut: sql<number>`count(*) filter (where ${tools.status} = 'OUT')::int`,
        })
        .from(tools)
        .then((rows) => rows[0]),
      db
        .select({
          overdue: sql<number>`count(*)::int`,
        })
        .from(checkoutLogs)
        .where(
          and(
            isNull(checkoutLogs.checkedInAt),
            sql`${checkoutLogs.expectedReturnAt} < current_date`,
          ),
        )
        .then((rows) => rows[0]),
      db
        .select({
          dueSoon: sql<number>`count(*)::int`,
        })
        .from(checkoutLogs)
        .where(dueSoonFilter())
        .then((rows) => rows[0]),
    ]);

    const total = Number(toolStats?.total ?? 0);
    const checkedOut = Number(toolStats?.checkedOut ?? 0);

    return {
      total,
      inStock: Number(toolStats?.inStock ?? 0),
      checkedOut,
      overdue: Number(overdueStats?.overdue ?? 0),
      dueSoon: Number(dueSoonStats?.dueSoon ?? 0),
      utilizationPercent:
        total > 0 ? Math.round((checkedOut / total) * 100) : 0,
    };
  },
  ["dashboard-stats"],
  { revalidate: 30, tags: ["dashboard-stats"] },
);

const getCachedOverdueReminder = unstable_cache(
  async () => {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(checkoutLogs)
      .where(
        and(
          isNull(checkoutLogs.checkedInAt),
          sql`${checkoutLogs.expectedReturnAt} < current_date`,
        ),
      );

    const items = await db
      .select({
        logId: checkoutLogs.id,
        toolLocalId: tools.localId,
        serialNumber: tools.serialNumber,
        customerName: customers.name,
        expectedReturnAt: checkoutLogs.expectedReturnAt,
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
      .orderBy(checkoutLogs.expectedReturnAt)
      .limit(OVERDUE_PREVIEW_LIMIT);

    return {
      count: Number(countRow?.count ?? 0),
      items,
    };
  },
  ["overdue-reminder"],
  { revalidate: 30, tags: ["overdue-reminder"] },
);

const getCachedDueSoonCheckouts = unstable_cache(
  async () => {
    const [countRow, items] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(checkoutLogs)
        .where(dueSoonFilter())
        .then((rows) => rows[0]),
      db
        .select({
          logId: checkoutLogs.id,
          toolLocalId: tools.localId,
          serialNumber: tools.serialNumber,
          customerEmployeeId: customers.employeeId,
          customerName: customers.name,
          expectedReturnAt: checkoutLogs.expectedReturnAt,
          checkedOutAt: checkoutLogs.checkedOutAt,
        })
        .from(checkoutLogs)
        .innerJoin(tools, eq(checkoutLogs.toolLocalId, tools.localId))
        .innerJoin(customers, eq(checkoutLogs.customerId, customers.id))
        .where(dueSoonFilter())
        .orderBy(checkoutLogs.expectedReturnAt)
        .limit(DASHBOARD_DUE_SOON_LIMIT),
    ]);

    return {
      count: Number(countRow?.count ?? 0),
      items,
    };
  },
  ["dashboard-due-soon"],
  { revalidate: 30, tags: ["dashboard-stats"] },
);

const getCachedTopCustomers = unstable_cache(
  async () => {
    const items = await db
      .select({
        customerId: customers.id,
        employeeId: customers.employeeId,
        name: customers.name,
        toolsOut: sql<number>`count(*)::int`,
      })
      .from(checkoutLogs)
      .innerJoin(customers, eq(checkoutLogs.customerId, customers.id))
      .where(isNull(checkoutLogs.checkedInAt))
      .groupBy(customers.id, customers.employeeId, customers.name)
      .orderBy(desc(sql`count(*)`), customers.name)
      .limit(TOP_CUSTOMERS_LIMIT);

    return items.map((item) => ({
      ...item,
      toolsOut: Number(item.toolsOut),
    }));
  },
  ["dashboard-top-customers"],
  { revalidate: 30, tags: ["dashboard-stats"] },
);

export async function getDashboardStats() {
  await requireAuth();
  return getCachedDashboardStats();
}

export async function getOverdueReminder() {
  await requireAuth();
  return getCachedOverdueReminder();
}

export async function getDueSoonCheckouts() {
  await requireAuth();
  return getCachedDueSoonCheckouts();
}

export async function getTopCustomersWithToolsOut() {
  await requireAuth();
  return getCachedTopCustomers();
}

const getCachedOverdueCheckouts = unstable_cache(
  async (limit: number) => {
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
      .orderBy(checkoutLogs.expectedReturnAt)
      .limit(limit);
  },
  ["dashboard-overdue"],
  { revalidate: 30, tags: ["dashboard-stats", "overdue-reminder"] },
);

export async function getOverdueCheckouts(limit = DASHBOARD_OVERDUE_LIMIT) {
  await requireAuth();
  return getCachedOverdueCheckouts(limit);
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

const getCachedRecentActivity = unstable_cache(
  async (limit: number): Promise<ActivityItem[]> => {
    const [checkoutEvents, checkinEvents] = await Promise.all([
      db
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
        .limit(limit),
      db
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
        .limit(limit),
    ]);

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
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, limit);
  },
  ["dashboard-recent-activity"],
  { revalidate: 30, tags: ["dashboard-stats"] },
);

export async function getRecentActivity(limit = 10): Promise<ActivityItem[]> {
  await requireAuth();
  const items = await getCachedRecentActivity(limit);

  return items.map((item) => ({
    ...item,
    occurredAt:
      item.occurredAt instanceof Date
        ? item.occurredAt
        : new Date(item.occurredAt),
  }));
}
