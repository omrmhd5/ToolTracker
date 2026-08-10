"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import type { CheckoutHistoryRow } from "@/actions/history";
import { deleteAllCheckoutHistory, deleteCheckoutLog } from "@/actions/history";
import { CheckoutNotesDisplay } from "@/components/checkout-notes-display";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";

const BASE_PATH = "/history";

export function HistoryManager({
  logs,
  total,
  page,
  pageSize,
  totalPages,
  isAdmin,
}: {
  logs: CheckoutHistoryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewingNotes, setViewingNotes] = useState<CheckoutHistoryRow | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<CheckoutHistoryRow | null>(
    null,
  );
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleDeleteRecord() {
    if (!deleteTarget) return;

    setLoading(true);
    const result = await deleteCheckoutLog(deleteTarget.id);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setDeleteTarget(null);
      return;
    }

    toast.success("History record deleted");

    setDeleteTarget(null);
    setError(null);
    router.refresh();
  }

  async function handleDeleteAll() {
    setLoading(true);
    const result = await deleteAllCheckoutHistory();
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      setDeleteAllOpen(false);
      return;
    }

    toast.success("All history deleted");

    setDeleteAllOpen(false);
    setError(null);
    router.refresh();
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
        <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-4">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(BASE_PATH)}>
            Clear
          </Button>
          {isAdmin && total > 0 ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setError(null);
                setDeleteAllOpen(true);
              }}>
              <Trash2 className="h-4 w-4" />
              Delete all
            </Button>
          ) : null}
        </div>
      </form>

      {error && !deleteTarget && !deleteAllOpen ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No checkout history found for these filters.
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground sm:hidden">
            Swipe horizontally to see all columns
          </p>
          <div className="-mx-4 overflow-x-auto overscroll-x-contain rounded-lg border touch-pan-x sm:mx-0 [webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-4xl text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Tool
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Checked out
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Expected
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Checked in
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const open = !log.checkedInAt;
                  const overdue = open && isOverdue(log.expectedReturnAt);

                  return (
                    <tr key={log.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-medium">{log.toolLocalId}</p>
                        <p className="whitespace-normal text-muted-foreground">
                          {log.serialNumber} · {log.partNumber}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {log.customerEmployeeId} — {log.customerName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        <p>{formatDateTime(log.checkedOutAt)}</p>
                        <p className="text-xs">by {log.checkedOutByName}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(log.expectedReturnAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
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
                      <td className="whitespace-nowrap px-4 py-3">
                        {open ? (
                          <Badge variant={overdue ? "destructive" : "warning"}>
                            {overdue ? "Overdue" : "Out"}
                          </Badge>
                        ) : (
                          <Badge variant="success">Returned</Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {log.notes?.trim() ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View note"
                              onClick={() => setViewingNotes(log)}>
                              <StickyNote className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {isAdmin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete record"
                              onClick={() => {
                                setError(null);
                                setDeleteTarget(log);
                              }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {!log.notes?.trim() && !isAdmin ? (
                            <span className="text-muted-foreground">—</span>
                          ) : null}
                        </div>
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete history record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the checkout record for{" "}
              {deleteTarget?.toolLocalId} ({deleteTarget?.serialNumber}).
              {!deleteTarget?.checkedInAt
                ? " The tool will be marked as checked in."
                : null}{" "}
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleteTarget ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the entire checkout history. Any
              tools currently checked out will be marked as checked in. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleteAllOpen ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} disabled={loading}>
              {loading ? "Deleting..." : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
