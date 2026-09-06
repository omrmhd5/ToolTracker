"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, ArrowRightLeft, StickyNote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  checkInTool,
  checkOutTool,
  type ToolOperationRow,
} from "@/actions/checkout";
import { CustomerPicker } from "@/components/customer-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime, isOverdue } from "@/lib/utils";
import { toast } from "sonner";

type ToolOperationsManagerProps = {
  tools: ToolOperationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const BASE_PATH = "/operations";

export function ToolOperationsManager({
  tools,
  total,
  page,
  pageSize,
  totalPages,
}: ToolOperationsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("operations");
  const tc = useTranslations("common");
  const tf = useTranslations("fields");

  const statusFilter = searchParams.get("status") ?? "ALL";
  const searchQuery = searchParams.get("q") ?? "";

  const [checkoutTarget, setCheckoutTarget] = useState<ToolOperationRow | null>(
    null,
  );
  const [checkinTarget, setCheckinTarget] = useState<ToolOperationRow | null>(
    null,
  );
  const [viewingNotes, setViewingNotes] = useState<ToolOperationRow | null>(
    null,
  );
  const [customerId, setCustomerId] = useState("");
  const [expectedReturnAt, setExpectedReturnAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function statusLabel(status: "IN" | "OUT") {
    return status === "IN" ? tc("in") : tc("out");
  }

  function applyFilters(next: { status?: string; q?: string; page?: number }) {
    const params = new URLSearchParams();
    const status = next.status ?? statusFilter;
    const q = next.q ?? searchQuery;
    const nextPage = next.page ?? 1;

    params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    if (nextPage > 1) params.set("page", String(nextPage));

    const query = params.toString();
    router.push(`${BASE_PATH}?${query}`);
  }

  function openCheckout(tool: ToolOperationRow) {
    setCheckoutTarget(tool);
    setCheckinTarget(null);
    setCustomerId("");
    setExpectedReturnAt("");
    setNotes("");
    setError(null);
  }

  function openCheckin(tool: ToolOperationRow) {
    setCheckinTarget(tool);
    setCheckoutTarget(null);
    setNotes("");
    setError(null);
  }

  function closeModals() {
    setCheckoutTarget(null);
    setCheckinTarget(null);
    setCustomerId("");
    setExpectedReturnAt("");
    setNotes("");
    setError(null);
    setLoading(false);
  }

  async function handleCheckout(event: React.FormEvent) {
    event.preventDefault();
    if (!checkoutTarget) return;

    setError(null);
    setLoading(true);

    const result = await checkOutTool({
      toolLocalId: checkoutTarget.localId,
      customerId,
      expectedReturnAt,
      notes,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(t("successOut", { id: checkoutTarget.localId }));
    closeModals();
    router.refresh();
  }

  async function handleCheckin(event: React.FormEvent) {
    event.preventDefault();
    if (!checkinTarget) return;

    setError(null);
    setLoading(true);

    const result = await checkInTool({
      toolLocalId: checkinTarget.localId,
      notes,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(t("successIn", { id: checkinTarget.localId }));
    closeModals();
    router.refresh();
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <form
            className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              applyFilters({ q: formData.get("q") as string, page: 1 });
            }}>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="searchQuery">{tc("search")}</Label>
              <Input
                id="searchQuery"
                name="q"
                defaultValue={searchQuery}
                placeholder={tc("searchPlaceholderAny")}
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="mt-auto shrink-0">
              {tc("search")}
            </Button>
          </form>
          <div className="space-y-2">
            <Label>{tc("status")}</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                applyFilters({ status: value, page: 1 })
              }>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tc("all")}</SelectItem>
                <SelectItem value="IN">{tc("in")}</SelectItem>
                <SelectItem value="OUT">{tc("out")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noToolsFound")}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("seq")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("localId")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("partNumber")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("serialNumber")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tc("name")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tc("locationSub")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("checkedOutAt")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("expectedReturn")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    {tf("status")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    {tc("action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr
                    key={tool.localId}
                    id={`tool-row-${tool.localId}`}
                    data-local-id={tool.localId}
                    className="border-b last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {tool.seq ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{tool.localId}</td>
                    <td className="px-4 py-3">{tool.partNumber}</td>
                    <td className="px-4 py-3">{tool.serialNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tool.commonName || tool.nomenclature || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {[tool.location, tool.subLocation]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tool.status === "OUT" && tool.checkedOutAt
                        ? formatDateTime(tool.checkedOutAt, locale)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tool.status === "OUT" && tool.expectedReturnAt ? (
                        <div className="inline-flex items-center gap-2">
                          {formatDate(tool.expectedReturnAt, locale)}
                          {isOverdue(tool.expectedReturnAt) ? (
                            <Badge variant="destructive">{tc("overdue")}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={tool.status === "IN" ? "success" : "warning"}>
                        {statusLabel(tool.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {tool.notes?.trim() ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={tc("viewNote")}
                            onClick={() => setViewingNotes(tool)}>
                            <StickyNote className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {tool.status === "IN" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-action="checkout"
                            aria-label={t("checkOutTool")}
                            onClick={() => openCheckout(tool)}>
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            data-action="checkin"
                            aria-label={t("checkInTool")}
                            onClick={() => openCheckin(tool)}>
                            <ArrowLeftRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {tc("showingTools", {
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

      <Dialog open={!!checkoutTarget} onOpenChange={() => closeModals()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("checkOutTool")}</DialogTitle>
            <DialogDescription>
              {checkoutTarget?.localId} — {checkoutTarget?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          {checkoutTarget ? (
            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{checkoutTarget.partNumber}</p>
                <p className="mt-1 text-muted-foreground">
                  {checkoutTarget.commonName ||
                    checkoutTarget.nomenclature ||
                    "—"}
                </p>
                {(checkoutTarget.location || checkoutTarget.subLocation) && (
                  <p className="mt-1 text-muted-foreground">
                    {t("locationLabel", {
                      location: [checkoutTarget.location, checkoutTarget.subLocation]
                        .filter(Boolean)
                        .join(" / "),
                    })}
                  </p>
                )}
              </div>

              <CustomerPicker
                key={checkoutTarget.localId}
                value={customerId}
                onChange={setCustomerId}
              />

              <div className="space-y-2">
                <Label htmlFor="expectedReturnAt">{tf("expectedReturn")}</Label>
                <Input
                  id="expectedReturnAt"
                  type="date"
                  value={expectedReturnAt}
                  onChange={(event) => setExpectedReturnAt(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkoutNotes">{tc("notesOptional")}</Label>
                <Textarea
                  id="checkoutNotes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModals}
                  disabled={loading}>
                  {tc("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !customerId || !expectedReturnAt}>
                  {loading ? t("checkingOut") : t("checkOut")}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkinTarget} onOpenChange={() => closeModals()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("checkInTool")}</DialogTitle>
            <DialogDescription>
              {checkinTarget?.localId} — {checkinTarget?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          {checkinTarget ? (
            <form onSubmit={handleCheckin} className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{checkinTarget.partNumber}</p>
                <p className="mt-1 text-muted-foreground">
                  {checkinTarget.commonName ||
                    checkinTarget.nomenclature ||
                    "—"}
                </p>
              </div>

              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">{tf("custody")}</p>
                {checkinTarget.customerName ? (
                  <>
                    <p className="mt-1 text-muted-foreground">
                      {checkinTarget.customerEmployeeId} —{" "}
                      {checkinTarget.customerName} (
                      {checkinTarget.customerSpecialization})
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {t("checkedOutLabel", {
                        date: formatDateTime(
                          checkinTarget.checkedOutAt,
                          locale,
                        ),
                      })}
                    </p>
                    <div className="mt-1 text-muted-foreground">
                      {t("expectedReturnLabel", {
                        date: formatDate(
                          checkinTarget.expectedReturnAt,
                          locale,
                        ),
                      })}
                      {isOverdue(checkinTarget.expectedReturnAt) ? (
                        <Badge variant="destructive" className="ml-2">
                          {tc("overdue")}
                        </Badge>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    {t("noCustody")}
                  </p>
                )}
              </div>

              {checkinTarget.notes?.trim() ? (
                <CheckoutNotesDisplay notes={checkinTarget.notes} />
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="checkinNotes">{tc("notesOptional")}</Label>
                <Textarea
                  id="checkinNotes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModals}
                  disabled={loading}>
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t("checkingIn") : t("checkIn")}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingNotes} onOpenChange={() => setViewingNotes(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tc("notes")}</DialogTitle>
            <DialogDescription>
              {viewingNotes?.localId} — {viewingNotes?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          {viewingNotes?.status === "IN" ? (
            <p className="text-xs text-muted-foreground">
              {t("fromLastCheckout")}
            </p>
          ) : null}
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
