"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StickyNote } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { CustomerWithCheckedOutTools } from "@/actions/customer-checkouts";
import { CheckoutNotesDisplay } from "@/components/checkout-notes-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";

const BASE_PATH = "/tools-by-customer";

export function ToolsByCustomerManager({
  customers,
  total,
  page,
  pageSize,
  totalPages,
}: {
  customers: CustomerWithCheckedOutTools[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("toolsByCustomer");
  const tc = useTranslations("common");
  const tf = useTranslations("fields");

  const [viewingNotes, setViewingNotes] = useState<{
    toolLocalId: string;
    serialNumber: string;
    notes: string | null;
  } | null>(null);

  const searchQuery = searchParams.get("q") ?? "";

  function applyFilters(next: { q?: string; page?: number }) {
    const params = new URLSearchParams();

    const q = next.q ?? searchQuery;
    const nextPage = next.page ?? 1;

    if (q.trim()) params.set("q", q.trim());
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    router.push(query ? `${BASE_PATH}?${query}` : BASE_PATH);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <>
      <form
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          applyFilters({
            q: formData.get("q") as string,
            page: 1,
          });
        }}>
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="customerSearch">{t("searchLabel")}</Label>
          <Input
            id="customerSearch"
            name="q"
            defaultValue={searchQuery}
            placeholder={tc("searchCustomersPlaceholder")}
          />
        </div>
        <Button type="submit" variant="secondary" className="shrink-0">
          {tc("search")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => router.push(BASE_PATH)}>
          {tc("clear")}
        </Button>
      </form>

      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noCustomers")}</p>
      ) : (
        <>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-lg border">
                <div className="flex flex-col gap-2 border-b bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.employeeId} · {customer.specialization}
                    </p>
                  </div>
                  <Badge
                    variant={
                      customer.totalToolsOut > 0 ? "warning" : "secondary"
                    }>
                    {t("toolsOut", { count: customer.totalToolsOut })}
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          {tf("localId")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tc("serial")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tf("partNumber")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tc("name")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tf("location")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tf("checkedOutAt")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tc("expected")}
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          {tf("status")}
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          {tc("notes")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.tools.map((tool) => {
                        const overdue = isOverdue(tool.expectedReturnAt);
                        const location = [tool.location, tool.subLocation]
                          .filter(Boolean)
                          .join(" / ");

                        return (
                          <tr
                            key={tool.checkoutLogId}
                            className="border-b last:border-0">
                            <td className="px-4 py-2 font-medium">
                              {tool.toolLocalId}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {tool.serialNumber}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {tool.partNumber}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {tool.commonName ?? "—"}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {location || "—"}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {formatDateTime(tool.checkedOutAt, locale)}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {formatDate(tool.expectedReturnAt, locale)}
                            </td>
                            <td className="px-4 py-2">
                              <Badge
                                variant={overdue ? "destructive" : "warning"}>
                                {overdue ? tc("overdue") : tc("out")}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {tool.notes?.trim() ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={tc("viewNote")}
                                  onClick={() =>
                                    setViewingNotes({
                                      toolLocalId: tool.toolLocalId,
                                      serialNumber: tool.serialNumber,
                                      notes: tool.notes,
                                    })
                                  }>
                                  <StickyNote className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {customer.totalToolsOut > customer.tools.length ? (
                    <p className="px-4 py-2 text-sm text-muted-foreground">
                      {t("showingOf", {
                        shown: customer.tools.length,
                        total: customer.totalToolsOut,
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {tc("showingCustomers", {
                from: rangeStart,
                to: rangeEnd,
                total,
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => applyFilters({ page: page - 1 })}>
                {tc("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {tc("pageOf", { page, totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => applyFilters({ page: page + 1 })}>
                {tc("next")}
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!viewingNotes} onOpenChange={() => setViewingNotes(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tc("notes")}</DialogTitle>
            <DialogDescription>
              {viewingNotes?.toolLocalId} — {viewingNotes?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          <CheckoutNotesDisplay notes={viewingNotes?.notes} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewingNotes(null)}>
              {tc("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
