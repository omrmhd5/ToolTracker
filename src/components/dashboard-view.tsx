"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DUE_SOON_DAYS } from "@/lib/dashboard-constants";
import { daysUntilDue, formatDate, formatDateTime } from "@/lib/utils";

type OverdueItem = {
  logId: string;
  toolLocalId: string;
  serialNumber: string;
  customerEmployeeId: string;
  customerName: string;
  expectedReturnAt: string;
  checkedOutAt: string;
};

type DueSoonItem = OverdueItem;

type TopCustomer = {
  customerId: string;
  employeeId: string;
  name: string;
  toolsOut: number;
};

type ActivityItem = {
  id: string;
  action: "CHECK_OUT" | "CHECK_IN";
  occurredAt: string;
  toolLocalId: string;
  serialNumber: string;
  customerEmployeeId: string;
  customerName: string;
  performedByName: string;
};

type DashboardStats = {
  total: number;
  inStock: number;
  checkedOut: number;
  overdue: number;
  dueSoon: number;
  utilizationPercent: number;
};

type DetailPanel = "overdue" | "dueSoon";

type DashboardViewProps = {
  stats: DashboardStats;
  overdue: OverdueItem[];
  dueSoon: { count: number; items: DueSoonItem[] };
  topCustomers: TopCustomer[];
  activity: ActivityItem[];
};

function formatDaysUntil(days: number | null) {
  if (days === null) return "—";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function DashboardView({
  stats,
  overdue,
  dueSoon,
  topCustomers,
  activity,
}: DashboardViewProps) {
  const [openPanel, setOpenPanel] = useState<DetailPanel | null>(null);

  const statCards = [
    { label: "Total tools", value: stats.total },
    { label: "In stock", value: stats.inStock },
    {
      label: "Checked out",
      value: stats.checkedOut,
      subtitle: `${stats.utilizationPercent}% utilization`,
    },
    {
      label: `Due in ${DUE_SOON_DAYS} days`,
      value: stats.dueSoon,
      highlight: stats.dueSoon > 0,
      highlightWarning: true,
      panel: "dueSoon" as const,
    },
    {
      label: "Overdue",
      value: stats.overdue,
      highlight: stats.overdue > 0,
      panel: "overdue" as const,
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((card) => {
            const isClickable = "panel" in card && card.panel;

            return (
              <Card
                key={card.label}
                className={
                  isClickable
                    ? "cursor-pointer transition-colors duration-150 ease-[var(--ease-out)] hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    : undefined
                }
                aria-label={
                  isClickable
                    ? `${card.label}: ${card.value}. View details`
                    : undefined
                }
                onClick={
                  isClickable ? () => setOpenPanel(card.panel!) : undefined
                }
                onKeyDown={
                  isClickable
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setOpenPanel(card.panel!);
                        }
                      }
                    : undefined
                }
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}>
                <CardHeader className="pb-2">
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle
                    className={`text-3xl ${
                      card.highlight
                        ? card.highlightWarning
                          ? "text-amber-600"
                          : "text-destructive"
                        : ""
                    }`}>
                    {card.value}
                  </CardTitle>
                  {card.subtitle ? (
                    <p className="text-sm text-muted-foreground">
                      {card.subtitle}
                    </p>
                  ) : null}
                  {isClickable ? (
                    <p className="text-xs text-muted-foreground">
                      Tap to view details
                    </p>
                  ) : null}
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top customers with tools out</CardTitle>
              <CardDescription>
                Customers holding the most checked-out tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tools are currently checked out.
                </p>
              ) : (
                <div className="space-y-3">
                  {topCustomers.map((customer, index) => (
                    <div
                      key={customer.customerId}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                      <p className="min-w-0 font-medium">
                        <span className="text-muted-foreground">
                          #{index + 1}
                        </span>{" "}
                        {customer.employeeId} — {customer.name}
                      </p>
                      <Badge variant="secondary">
                        {customer.toolsOut}{" "}
                        {customer.toolsOut === 1 ? "tool" : "tools"}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href="/tools-by-customer"
                      className="font-medium underline-offset-4 hover:underline">
                      View all customers with tools out
                    </Link>
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href="/history"
                      className="font-medium underline-offset-4 hover:underline">
                      View full history
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={openPanel === "overdue"}
        onOpenChange={(open) => !open && setOpenPanel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Overdue returns</DialogTitle>
            <DialogDescription>
              Checked-out tools past their expected return date
            </DialogDescription>
          </DialogHeader>
          {overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No overdue tools right now.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {overdue.map((item) => (
                <div
                  key={item.logId}
                  className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm sm:flex-row sm:items-start sm:justify-between">
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
          {stats.overdue > overdue.length ? (
            <p className="text-sm text-muted-foreground">
              Showing {overdue.length} of {stats.overdue} overdue tools.{" "}
              <Link
                href="/operations?status=OUT"
                className="font-medium text-destructive underline-offset-4 hover:underline">
                View all checked-out tools
              </Link>
            </p>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={openPanel === "dueSoon"}
        onOpenChange={(open) => !open && setOpenPanel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Due soon</DialogTitle>
            <DialogDescription>
              Open checkouts due within the next {DUE_SOON_DAYS} days
            </DialogDescription>
          </DialogHeader>
          {dueSoon.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tools due in the next {DUE_SOON_DAYS} days.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {dueSoon.items.map((item) => {
                const daysLeft = daysUntilDue(item.expectedReturnAt);

                return (
                  <div
                    key={item.logId}
                    className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {item.toolLocalId} — {item.serialNumber}
                      </p>
                      <p className="text-muted-foreground">
                        {item.customerEmployeeId} — {item.customerName}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {formatDaysUntil(daysLeft)} ·{" "}
                        {formatDate(item.expectedReturnAt)}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
          {dueSoon.count > dueSoon.items.length ? (
            <p className="text-sm text-muted-foreground">
              Showing {dueSoon.items.length} of {dueSoon.count} due soon.{" "}
              <Link
                href="/operations?status=OUT"
                className="font-medium text-amber-700 underline-offset-4 hover:underline">
                View checked-out tools
              </Link>
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
