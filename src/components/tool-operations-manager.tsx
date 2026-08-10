"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, ArrowRightLeft, StickyNote } from "lucide-react";
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

    toast.success(`Tool ${checkoutTarget.localId} checked out`);
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

    toast.success(`Tool ${checkinTarget.localId} checked in`);
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
            className="flex flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              applyFilters({ q: formData.get("q") as string, page: 1 });
            }}>
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="searchQuery">Search</Label>
              <Input
                id="searchQuery"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by any field..."
              />
            </div>
            <Button
              type="submit"
              variant="secondary"
              className="mt-auto shrink-0">
              Search
            </Button>
          </form>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                applyFilters({ status: value, page: 1 })
              }>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tools found. Adjust your search or filters.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-left font-medium">Local ID</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Part number
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Serial number
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Location/sub
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Checked out at
                  </th>
                  <th className="px-4 py-3 text-left font-medium">
                    Expected return
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.localId} className="border-b last:border-0">
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
                        ? formatDateTime(tool.checkedOutAt)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tool.status === "OUT" && tool.expectedReturnAt ? (
                        <div className="inline-flex items-center gap-2">
                          {formatDate(tool.expectedReturnAt)}
                          {isOverdue(tool.expectedReturnAt) ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : null}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={tool.status === "IN" ? "success" : "warning"}>
                        {tool.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {tool.notes?.trim() ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View note"
                            onClick={() => setViewingNotes(tool)}>
                            <StickyNote className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {tool.status === "IN" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Check out"
                            onClick={() => openCheckout(tool)}>
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Check in"
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
              Showing {rangeStart}–{rangeEnd} of {total} tools
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

      <Dialog open={!!checkoutTarget} onOpenChange={() => closeModals()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Check out tool</DialogTitle>
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
                    Location:{" "}
                    {[checkoutTarget.location, checkoutTarget.subLocation]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
              </div>

              <CustomerPicker
                key={checkoutTarget.localId}
                value={customerId}
                onChange={setCustomerId}
              />

              <div className="space-y-2">
                <Label htmlFor="expectedReturnAt">Expected return</Label>
                <Input
                  id="expectedReturnAt"
                  type="date"
                  value={expectedReturnAt}
                  onChange={(event) => setExpectedReturnAt(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkoutNotes">Notes (optional)</Label>
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !customerId || !expectedReturnAt}>
                  {loading ? "Checking out..." : "Check out"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkinTarget} onOpenChange={() => closeModals()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Check in tool</DialogTitle>
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
                <p className="font-medium">Custody</p>
                {checkinTarget.customerName ? (
                  <>
                    <p className="mt-1 text-muted-foreground">
                      {checkinTarget.customerEmployeeId} —{" "}
                      {checkinTarget.customerName} (
                      {checkinTarget.customerSpecialization})
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Checked out: {formatDateTime(checkinTarget.checkedOutAt)}
                    </p>
                    <div className="mt-1 text-muted-foreground">
                      Expected return:{" "}
                      {formatDate(checkinTarget.expectedReturnAt)}
                      {isOverdue(checkinTarget.expectedReturnAt) ? (
                        <Badge variant="destructive" className="ml-2">
                          Overdue
                        </Badge>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    No custody details found.
                  </p>
                )}
              </div>

              {checkinTarget.notes?.trim() ? (
                <CheckoutNotesDisplay notes={checkinTarget.notes} />
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="checkinNotes">Notes (optional)</Label>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Checking in..." : "Check in"}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingNotes} onOpenChange={() => setViewingNotes(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
            <DialogDescription>
              {viewingNotes?.localId} — {viewingNotes?.serialNumber}
            </DialogDescription>
          </DialogHeader>
          {viewingNotes?.status === "IN" ? (
            <p className="text-xs text-muted-foreground">From last checkout</p>
          ) : null}
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
