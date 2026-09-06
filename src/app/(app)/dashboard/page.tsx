import {
  getDashboardStats,
  getDueSoonCheckouts,
  getOverdueCheckouts,
  getRecentActivity,
  getTopCustomersWithToolsOut,
} from "@/actions/dashboard";
import { DashboardView } from "@/components/dashboard-view";
import { auth } from "@/lib/auth";

function serializeDate(value: Date | string) {
  return typeof value === "string" ? value : value.toISOString();
}

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const [stats, overdue, dueSoon, topCustomers, activity] = await Promise.all([
    getDashboardStats(),
    getOverdueCheckouts(20),
    getDueSoonCheckouts(),
    getTopCustomersWithToolsOut(),
    getRecentActivity(),
  ]);

  return (
    <DashboardView
      stats={stats}
      overdue={overdue.map((item) => ({
        ...item,
        expectedReturnAt: serializeDate(item.expectedReturnAt),
        checkedOutAt: serializeDate(item.checkedOutAt),
      }))}
      dueSoon={{
        count: dueSoon.count,
        items: dueSoon.items.map((item) => ({
          ...item,
          expectedReturnAt: serializeDate(item.expectedReturnAt),
          checkedOutAt: serializeDate(item.checkedOutAt),
        })),
      }}
      topCustomers={topCustomers}
      activity={activity.map((item) => ({
        ...item,
        occurredAt: serializeDate(item.occurredAt),
      }))}
      isAdmin={isAdmin}
    />
  );
}
