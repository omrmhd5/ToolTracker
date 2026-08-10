"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, ArrowRight, Clock, History, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type PanelId = "overdue" | "dueSoon" | "topCustomers" | "activity";

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

function PanelCard({
  title,
  description,
  count,
  countLabel,
  icon: Icon,
  tone = "default",
  preview,
  onOpen,
}: {
  title: string;
  description: string;
  count: number;
  countLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "destructive" | "warning";
  preview?: string;
  onOpen: () => void;
}) {
  const toneClasses = {
    default: "text-foreground",
    destructive: "text-destructive",
    warning: "text-amber-600 dark:text-amber-500",
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border bg-muted/50 p-2">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <span className={`text-2xl font-semibold ${toneClasses[tone]}`}>
            {count}
          </span>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        {preview ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {preview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{countLabel}</p>
        )}
        <Button variant="outline" className="w-full" onClick={onOpen}>
          View details
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function DashboardView({
  stats,
  overdue,
  dueSoon,
  topCustomers,
  activity,
}: DashboardViewProps) {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null);

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

  const overduePreview =
    overdue.length > 0
      ? `${overdue[0].toolLocalId} — ${overdue[0].customerName}`
      : undefined;

  const dueSoonPreview =
    dueSoon.items.length > 0
      ? `${dueSoon.items[0].toolLocalId} — ${dueSoon.items[0].customerName}`
      : undefined;

  const topCustomersPreview =
    topCustomers.length > 0
      ? `#1 ${topCustomers[0].employeeId} — ${topCustomers[0].name}`
      : undefined;

  const activityPreview =
    activity.length > 0
      ? `${activity[0].action === "CHECK_IN" ? "Check in" : "Check out"}: ${activity[0].toolLocalId}`
      : undefined;

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
                    ? "cursor-pointer transition-colors hover:bg-muted/30"
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
                          ? "text-amber-600 dark:text-amber-500"
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

        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <PanelCard
              title="Overdue returns"
              description="Tools past their expected return date"
              count={stats.overdue}
              countLabel="No overdue tools right now."
              icon={AlertTriangle}
              tone={stats.overdue > 0 ? "destructive" : "default"}
              preview={overduePreview}
              onOpen={() => setOpenPanel("overdue")}
            />
            <PanelCard
              title="Due soon"
              description={`Due within the next ${DUE_SOON_DAYS} days`}
              count={dueSoon.count}
              countLabel={`No tools due in the next ${DUE_SOON_DAYS} days.`}
              icon={Clock}
              tone={dueSoon.count > 0 ? "warning" : "default"}
              preview={dueSoonPreview}
              onOpen={() => setOpenPanel("dueSoon")}
            />
            <PanelCard
              title="Top customers"
              description="Customers with the most tools out"
              count={topCustomers.length}
              countLabel="No tools are currently checked out."
              icon={Users}
              preview={topCustomersPreview}
              onOpen={() => setOpenPanel("topCustomers")}
            />
            <PanelCard
              title="Recent activity"
              description="Latest checkouts and check-ins"
              count={activity.length}
              countLabel="No checkout activity yet."
              icon={History}
              preview={activityPreview}
              onOpen={() => setOpenPanel("activity")}
            />
          </div>
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
                className="font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-500">
                View checked-out tools
              </Link>
            </p>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={openPanel === "topCustomers"}
        onOpenChange={(open) => !open && setOpenPanel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Top customers with tools out</DialogTitle>
            <DialogDescription>
              Customers holding the most checked-out tools
            </DialogDescription>
          </DialogHeader>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tools are currently checked out.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <p className="min-w-0 font-medium">
                    <span className="text-muted-foreground">#{index + 1}</span>{" "}
                    {customer.employeeId} — {customer.name}
                  </p>
                  <Badge variant="secondary">
                    {customer.toolsOut}{" "}
                    {customer.toolsOut === 1 ? "tool" : "tools"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            <Link
              href="/tools-by-customer"
              className="font-medium underline-offset-4 hover:underline">
              View all customers with tools out
            </Link>
          </p>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openPanel === "activity"}
        onOpenChange={(open) => !open && setOpenPanel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Recent activity</DialogTitle>
            <DialogDescription>
              Last 10 checkouts and check-ins
            </DialogDescription>
          </DialogHeader>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No checkout activity yet.
            </p>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {activity.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        item.action === "CHECK_IN" ? "success" : "warning"
                      }>
                      {item.action === "CHECK_IN" ? "Check in" : "Check out"}
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
          <p className="text-sm text-muted-foreground">
            <Link
              href="/history"
              className="font-medium underline-offset-4 hover:underline">
              View full history
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
