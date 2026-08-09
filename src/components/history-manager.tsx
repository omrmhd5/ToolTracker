"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StickyNote } from "lucide-react";
import type { CheckoutHistoryRow } from "@/actions/history";
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

const BASE_PATH = "/history";

export function HistoryManager({
  logs,
  total,
  page,
  pageSize,
  totalPages,
}: {
  logs: CheckoutHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewingNotes, setViewingNotes] = useState<CheckoutHistoryRow | null>(
    null,
  );

  const toolQuery = searchParams.get("q") ?? "";
  const customerQuery = searchParams.get("customer") ?? "";
  const fromDate = searchParams.get("from") ?? "";
  const toDate = searchParams.get("to") ?? "";

  function applyFilters(next: {
    q?: string;
    customer?: string;
    from?: string;
    to?: string;
    page?: number;
  }) {
    const params = new URLSearchParams();

    const q = next.q ?? toolQuery;
    const customer = next.customer ?? customerQuery;
    const from = next.from ?? fromDate;
    const to = next.to ?? toDate;
    const nextPage = next.page ?? 1;

    if (q.trim()) params.set("q", q.trim());
    if (customer.trim()) params.set("customer", customer.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    router.push(query ? `${BASE_PATH}?${query}` : BASE_PATH);
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <>
      <form
        className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          applyFilters({
            q: formData.get("q") as string,
            customer: formData.get("customer") as string,
            from: formData.get("from") as string,
            to: formData.get("to") as string,
            page: 1,
          });
        }}>
        <div className="space-y-2">
          <Label htmlFor="toolQuery">Tool</Label>
          <Input
            id="toolQuery"
            name="q"
            defaultValue={toolQuery}
            placeholder="Local ID, serial, or part #"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerQuery">Customer</Label>
          <Input
            id="customerQuery"
            name="customer"
            defaultValue={customerQuery}
            placeholder="Employee ID or name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromDate">From</Label>
          <Input
            id="fromDate"
            name="from"
            type="date"
            defaultValue={fromDate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toDate">To</Label>
          <Input id="toDate" name="to" type="date" defaultValue={toDate} />
        </div>
        <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(BASE_PATH)}>
            Clear
          </Button>
        </div>
      </form>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No checkout history found for these filters.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Tool</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Checked out
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Expected</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Checked in
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const open = !log.checkedInAt;
                  const overdue = open && isOverdue(log.expectedReturnAt);

                  return (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{log.toolLocalId}</p>
                        <p className="text-muted-foreground">
                          {log.serialNumber} · {log.partNumber}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.customerEmployeeId} — {log.customerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <p>{formatDateTime(log.checkedOutAt)}</p>
                        <p className="text-xs">by {log.checkedOutByName}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(log.expectedReturnAt)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.checkedInAt ? (
                          <>
                            <p>{formatDateTime(log.checkedInAt)}</p>
                            <p className="text-xs">
                              by {log.checkedInByName ?? "—"}
                            </p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {open ? (
                          <Badge variant={overdue ? "destructive" : "warning"}>
                            {overdue ? "Overdue" : "Out"}
                          </Badge>
                        ) : (
                          <Badge variant="success">Returned</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.notes?.trim() ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View note"
                            onClick={() => setViewingNotes(log)}>
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
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {total} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => applyFilters({ page: page - 1 })}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => applyFilters({ page: page + 1 })}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!viewingNotes} onOpenChange={() => setViewingNotes(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
            <DialogDescription>
              {viewingNotes?.toolLocalId} — {viewingNotes?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          <CheckoutNotesDisplay notes={viewingNotes?.notes} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setViewingNotes(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
