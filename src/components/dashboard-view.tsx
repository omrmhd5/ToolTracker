"use client";

import Link from "next/link";
import { Settings, Users, Wrench } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

type DetailPanel = "overdue" | "dueSoon";

type DashboardViewProps = {
  stats: DashboardStats;
  overdue: OverdueItem[];
  dueSoon: { count: number; items: DueSoonItem[] };
  topCustomers: TopCustomer[];
  activity: ActivityItem[];
  isAdmin?: boolean;
};

export function DashboardView({
  stats,
  overdue,
  dueSoon,
  topCustomers,
  activity,
  isAdmin = false,
}: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [openPanel, setOpenPanel] = useState<DetailPanel | null>(null);

  const statCards = [
    { label: t("totalTools"), value: stats.total },
    { label: t("inStock"), value: stats.inStock },
    {
      label: t("checkedOut"),
      value: stats.checkedOut,
      subtitle: t("utilization", { percent: stats.utilizationPercent }),
    },
    {
      label: t("dueInDaysCount", { days: DUE_SOON_DAYS }),
      value: stats.dueSoon,
      highlight: stats.dueSoon > 0,
      highlightWarning: true,
      panel: "dueSoon" as const,
    },
    {
      label: t("overdue"),
      value: stats.overdue,
      highlight: stats.overdue > 0,
      panel: "overdue" as const,
    },
  ];

  function formatDaysUntil(days: number | null) {
    if (days === null) return "—";
    if (days === 0) return tCommon("dueToday");
    if (days === 1) return tCommon("dueTomorrow");
    return tCommon("dueInDaysFmt", { days });
  }

  return (
    <>
      <div id="dashboard-page" className="space-y-6">
        <div
          id="dashboard-stats"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                aria-label={isClickable ? t("tapDetails") : undefined}
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
                      {t("tapDetails")}
                    </p>
                  ) : null}
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card id="dashboard-customers">
            <CardHeader>
              <CardTitle>{t("topCustomers")}</CardTitle>
              <CardDescription>{t("topCustomersHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noCheckedOut")}
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
                        {t("toolCount", { count: customer.toolsOut })}
                      </Badge>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href="/tools-by-customer"
                      className="font-medium underline-offset-4 hover:underline">
                      {t("viewAllCustomers")}
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="dashboard-activity">
            <CardHeader>
              <CardTitle>{t("recentActivity")}</CardTitle>
              <CardDescription>{t("recentActivityHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("noActivity")}
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
                            ? t("checkIn")
                            : t("checkOut")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.occurredAt, locale)}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">
                        {item.toolLocalId} — {item.serialNumber}
                      </p>
                      <p className="text-muted-foreground">
                        {item.customerEmployeeId} — {item.customerName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("byUser", { name: item.performedByName })}
                      </p>
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground">
                    <Link
                      href="/history"
                      className="font-medium underline-offset-4 hover:underline">
                      {t("viewHistory")}
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin ? (
          <Card id="dashboard-admin">
            <CardHeader>
              <CardTitle>{t("adminShortcuts")}</CardTitle>
              <CardDescription>{t("adminShortcutsHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/tools">
                    <Wrench className="h-4 w-4" />
                    {t("manageTools")}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/customers">
                    <Users className="h-4 w-4" />
                    {t("manageCustomers")}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/users">
                    <Settings className="h-4 w-4" />
                    {t("manageUsers")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Dialog
        open={openPanel === "overdue"}
        onOpenChange={(open) => !open && setOpenPanel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("overdueReturns")}</DialogTitle>
            <DialogDescription>{t("overdueHint")}</DialogDescription>
          </DialogHeader>
          {overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noOverdue")}</p>
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
                      {t("due", { date: formatDate(item.expectedReturnAt, locale) })}{" "}
                      · {t("checkedOutOn", { date: formatDate(item.checkedOutAt, locale) })}
                    </p>
                  </div>
                  <Badge variant="destructive">{tCommon("overdue")}</Badge>
                </div>
              ))}
            </div>
          )}
          {stats.overdue > overdue.length ? (
            <p className="text-sm text-muted-foreground">
              {t("showingOverdue", {
                shown: overdue.length,
                total: stats.overdue,
              })}{" "}
              <Link
                href="/operations?status=OUT"
                className="font-medium text-destructive underline-offset-4 hover:underline">
                {t("viewCheckedOut")}
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
            <DialogTitle>{t("dueSoonTitle")}</DialogTitle>
            <DialogDescription>
              {t("dueSoonHint", { days: DUE_SOON_DAYS })}
            </DialogDescription>
          </DialogHeader>
          {dueSoon.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noDueSoon", { days: DUE_SOON_DAYS })}
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
                        {formatDate(item.expectedReturnAt, locale)}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {daysLeft === 0
                        ? tCommon("today")
                        : tCommon("daysShort", { days: daysLeft ?? 0 })}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
          {dueSoon.count > dueSoon.items.length ? (
            <p className="text-sm text-muted-foreground">
              {t("showingDueSoon", {
                shown: dueSoon.items.length,
                total: dueSoon.count,
              })}{" "}
              <Link
                href="/operations?status=OUT"
                className="font-medium text-amber-700 underline-offset-4 hover:underline">
                {t("viewCheckedOutTools")}
              </Link>
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
