import Link from "next/link";
import { Settings, Users, Wrench } from "lucide-react";
import {
  getDashboardStats,
  getDueSoonCheckouts,
  getOverdueCheckouts,
  getRecentActivity,
  getTopCustomersWithToolsOut,
} from "@/actions/dashboard";
import { DashboardView } from "@/components/dashboard-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

const adminLinks = [
  { href: "/admin/tools", label: "Manage tools", icon: Wrench },
  { href: "/admin/customers", label: "Manage customers", icon: Users },
  { href: "/admin/users", label: "Manage users", icon: Settings },
];

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
    <div className="space-y-6">
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
      />

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Admin shortcuts</CardTitle>
            <CardDescription>Quick links to master data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button key={link.href} variant="outline" asChild>
                    <Link href={link.href}>
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
