"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StickyNote, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { FormError } from "@/components/ui/form-error";
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
  const locale = useLocale();
  const t = useTranslations("history");
  const tc = useTranslations("common");
  const tf = useTranslations("fields");

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

    toast.success(t("deleted"));

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

    toast.success(t("deletedAll"));

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
          <Label htmlFor="toolQuery">{tc("tool")}</Label>
          <Input
            id="toolQuery"
            name="q"
            defaultValue={toolQuery}
            placeholder={tc("searchToolsPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerQuery">{t("customer")}</Label>
          <Input
            id="customerQuery"
            name="customer"
            defaultValue={customerQuery}
            placeholder={tc("searchCustomerPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fromDate">{t("from")}</Label>
          <Input
            id="fromDate"
            name="from"
            type="date"
            defaultValue={fromDate}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toDate">{t("to")}</Label>
          <Input id="toDate" name="to" type="date" defaultValue={toDate} />
        </div>
        <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-4">
          <Button type="submit" variant="secondary">
            {tc("applyFilters")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(BASE_PATH)}>
            {tc("clear")}
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
              {t("deleteAll")}
            </Button>
          ) : null}
        </div>
      </form>

      {error && !deleteTarget && !deleteAllOpen ? (
        <FormError className="mb-4">{error}</FormError>
      ) : null}

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noHistory")}</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground sm:hidden">
            {tc("swipeColumns")}
          </p>
          <div className="-mx-4 overflow-x-auto overscroll-x-contain rounded-lg border touch-pan-x sm:mx-0 [webkit-overflow-scrolling:touch]">
            <table
              className="w-full min-w-[56rem] text-sm"
              aria-label={t("tableLabel")}>
              <thead className="border-b bg-muted/50">
                <tr>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    {tc("tool")}
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    {tf("customer")}
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    {tf("checkedOutAt")}
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    {tc("expected")}
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    {tf("checkedInAt")}
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left font-medium">
                    {tf("status")}
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    {tc("actions")}
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
                        <p>{formatDateTime(log.checkedOutAt, locale)}</p>
                        <p className="text-xs">
                          {tc("byName", { name: log.checkedOutByName })}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatDate(log.expectedReturnAt, locale)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {log.checkedInAt ? (
                          <>
                            <p>{formatDateTime(log.checkedInAt, locale)}</p>
                            <p className="text-xs">
                              {log.checkedInByName
                                ? tc("byName", { name: log.checkedInByName })
                                : "—"}
                            </p>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {open ? (
                          <Badge variant={overdue ? "destructive" : "warning"}>
                            {overdue ? tc("overdue") : tc("out")}
                          </Badge>
                        ) : (
                          <Badge variant="success">{tc("returned")}</Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {log.notes?.trim() ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={tc("viewNote")}
                              onClick={() => setViewingNotes(log)}>
                              <StickyNote className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {isAdmin ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("deleteRecord")}
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
              {tc("showingRecords", {
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteRecordTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteRecordBody", {
                id: deleteTarget?.toolLocalId ?? "",
                serial: deleteTarget?.serialNumber ?? "",
              })}
              {!deleteTarget?.checkedInAt ? ` ${t("deleteRecordOpen")}` : null}{" "}
              {tc("cannotUndo")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleteTarget ? <FormError>{error}</FormError> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} disabled={loading}>
              {loading ? tc("deleting") : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteAllTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteAllBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleteAllOpen ? <FormError>{error}</FormError> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} disabled={loading}>
              {loading ? tc("deleting") : t("deleteAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
