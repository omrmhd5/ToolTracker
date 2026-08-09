import Link from "next/link";
import { Settings, Users, Wrench } from "lucide-react";
import {
  getDashboardStats,
  getOverdueCheckouts,
  getRecentActivity,
} from "@/actions/dashboard";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";

const adminLinks = [
  { href: "/admin/tools", label: "Manage tools", icon: Wrench },
  { href: "/admin/customers", label: "Manage customers", icon: Users },
  { href: "/admin/users", label: "Manage users", icon: Settings },
];

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const [stats, overdue, activity] = await Promise.all([
    getDashboardStats(),
    getOverdueCheckouts(),
    getRecentActivity(),
  ]);

  const statCards = [
    { label: "Total tools", value: stats.total },
    { label: "In stock", value: stats.inStock },
    { label: "Checked out", value: stats.checkedOut },
    {
      label: "Overdue",
      value: stats.overdue,
      highlight: stats.overdue > 0,
    },
  ];

  return (
    <AppShell
      currentPath="/dashboard"
      title="Dashboard"
      description="Overview of tools and custody status">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle
                  className={`text-3xl ${card.highlight ? "text-destructive" : ""}`}>
                  {card.value}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Overdue returns</CardTitle>
              <CardDescription>
                Checked-out tools past their expected return date
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdue.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No overdue tools right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {overdue.map((item) => (
                    <div
                      key={item.logId}
                      className="flex items-start justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {item.toolLocalId} — {item.serialNumber}
                        </p>
                        <p className="text-muted-foreground">
                          {item.customerEmployeeId} — {item.customerName}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Due {formatDate(item.expectedReturnAt)} · Checked out{" "}
                          {formatDate(item.checkedOutAt)}
                        </p>
                      </div>
                      <Badge variant="destructive">Overdue</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Last 10 checkouts and check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No checkout activity yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            item.action === "CHECK_IN" ? "success" : "warning"
                          }>
                          {item.action === "CHECK_IN"
                            ? "Check in"
                            : "Check out"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">
                        {item.toolLocalId} — {item.serialNumber}
                      </p>
                      <p className="text-muted-foreground">
                        {item.customerEmployeeId} — {item.customerName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        By {item.performedByName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
    </AppShell>
  );
}
