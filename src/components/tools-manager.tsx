"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  createTool,
  deleteTool,
  peekNextToolNumber,
  updateTool,
} from "@/actions/tools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type ToolRow = {
  localId: string;
  seq: number | null;
  nsn: string | null;
  partNumber: string;
  serialNumber: string;
  nomenclature: string | null;
  commonName: string | null;
  authqty: number;
  assignedqty: number;
  location: string | null;
  subLocation: string | null;
  inventoryDate: string | null;
  status: "IN" | "OUT";
  custodyExpectedReturn: string | null;
};

export function ToolsManager({
  tools,
  total,
  page,
  pageSize,
  totalPages,
}: {
  tools: ToolRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("adminTools");
  const tc = useTranslations("common");
  const tf = useTranslations("fields");

  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<ToolRow | null>(null);
  const [editing, setEditing] = useState<ToolRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ToolRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  const statusFilter = searchParams.get("status") ?? "ALL";
  const searchQuery = searchParams.get("q") ?? "";

  function statusLabel(status: "IN" | "OUT") {
    return status === "IN" ? tc("in") : tc("out");
  }

  function applyFilters(status: string, q: string, nextPage = 1) {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/admin/tools?${query}` : "/admin/tools");
  }

  async function openCreate() {
    setEditing(null);
    setError(null);
    setNextNumber(await peekNextToolNumber());
    setOpen(true);
  }

  function openView(tool: ToolRow) {
    setViewing(tool);
  }

  function openEdit(tool: ToolRow) {
    setEditing(tool);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      localId: editing ? editing.localId : (formData.get("localId") as string),
      nsn: formData.get("nsn") as string,
      partNumber: formData.get("partNumber") as string,
      serialNumber: formData.get("serialNumber") as string,
      nomenclature: formData.get("nomenclature") as string,
      commonName: formData.get("commonName") as string,
      authqty: formData.get("authqty") as string,
      location: formData.get("location") as string,
      subLocation: formData.get("subLocation") as string,
      inventoryDate: formData.get("inventoryDate") as string,
    };

    const result = editing
      ? await updateTool(editing.localId, payload)
      : await createTool(payload);

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success(editing ? t("updated") : t("created"));

    setOpen(false);
    setEditing(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setLoading(true);
    const result = await deleteTool(deleteTarget.localId);
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
              applyFilters(statusFilter, formData.get("q") as string, 1);
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
              onValueChange={(value) => applyFilters(value, searchQuery, 1)}>
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
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          {t("addTool")}
        </Button>
      </div>

      {error && !open && !deleteTarget ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noToolsAdmin")}</p>
      ) : (
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
                  {tc("inventory")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tf("status")}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {tc("actions")}
                </th>
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
                    {formatDate(tool.inventoryDate, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={tool.status === "IN" ? "success" : "warning"}>
                      {statusLabel(tool.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("viewDetails")}
                        onClick={() => openView(tool)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("editTool")}
                        onClick={() => openEdit(tool)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("deleteTool")}
                        onClick={() => {
                          setError(null);
                          setDeleteTarget(tool);
                        }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tools.length > 0 ? (
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
              onClick={() => applyFilters(statusFilter, searchQuery, page - 1)}>
              {tc("previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {tc("pageOf", { page, totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => applyFilters(statusFilter, searchQuery, page + 1)}>
              {tc("next")}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("toolDetails")}</DialogTitle>
            <DialogDescription>
              {viewing?.serialNumber} — {viewing?.partNumber}
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <DetailItem label={tf("seq")} value={viewing.seq ?? "—"} />
              <DetailItem label={tf("localId")} value={viewing.localId} />
              <DetailItem label={tf("nsn")} value={viewing.nsn || "—"} />
              <DetailItem
                label={tf("partNumber")}
                value={viewing.partNumber}
              />
              <DetailItem
                label={tf("serialNumber")}
                value={viewing.serialNumber}
              />
              <DetailItem
                label={tf("nomenclature")}
                value={viewing.nomenclature || "—"}
              />
              <DetailItem
                label={tf("commonName")}
                value={viewing.commonName || "—"}
              />
              <DetailItem label={tf("authqty")} value={viewing.authqty} />
              <DetailItem
                label={tf("assignedqty")}
                value={viewing.assignedqty}
              />
              <DetailItem
                label={tf("location")}
                value={viewing.location || "—"}
              />
              <DetailItem
                label={tf("subLocation")}
                value={viewing.subLocation || "—"}
              />
              <DetailItem
                label={tf("status")}
                value={
                  <Badge
                    variant={viewing.status === "IN" ? "success" : "warning"}>
                    {statusLabel(viewing.status)}
                  </Badge>
                }
              />
              <DetailItem
                label={tf("custody")}
                value={
                  viewing.custodyExpectedReturn
                    ? formatDate(viewing.custodyExpectedReturn, locale)
                    : "—"
                }
              />
              <DetailItem
                label={tc("inventory")}
                value={formatDate(viewing.inventoryDate, locale)}
              />
            </dl>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              {tc("close")}
            </Button>
            {viewing ? (
              <Button
                onClick={() => {
                  setViewing(null);
                  openEdit(viewing);
                }}>
                {t("editTool")}
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTool") : t("addTool")}</DialogTitle>
            <DialogDescription>
              {t("formHint")}
              {editing?.status === "OUT" ? ` ${t("checkedOutLock")}` : null}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{tf("seq")}</Label>
                <Input
                  value={
                    editing
                      ? String(editing.seq ?? "—")
                      : String(nextNumber ?? "…")
                  }
                  disabled
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localId">{tf("localId")}</Label>
                <Input
                  id="localId"
                  name="localId"
                  defaultValue={editing?.localId ?? ""}
                  required={!editing}
                  readOnly={!!editing}
                  disabled={loading || !!editing}
                  tabIndex={editing ? -1 : undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nsn">{tf("nsn")}</Label>
              <Input
                id="nsn"
                name="nsn"
                defaultValue={editing?.nsn ?? ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partNumber">{tf("partNumber")}</Label>
              <Input
                id="partNumber"
                name="partNumber"
                defaultValue={editing?.partNumber ?? ""}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">{tf("serialNumber")}</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                defaultValue={editing?.serialNumber ?? ""}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomenclature">{tf("nomenclature")}</Label>
              <Input
                id="nomenclature"
                name="nomenclature"
                defaultValue={editing?.nomenclature ?? ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commonName">{tf("commonName")}</Label>
              <Input
                id="commonName"
                name="commonName"
                defaultValue={editing?.commonName ?? ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authqty">{tf("authqty")}</Label>
              <Input
                id="authqty"
                name="authqty"
                type="number"
                min={0}
                defaultValue={editing?.authqty ?? 1}
                disabled={loading || editing?.status === "OUT"}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{tf("location")}</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editing?.location ?? ""}
                  placeholder={t("locationPlaceholder")}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subLocation">{tf("subLocation")}</Label>
                <Input
                  id="subLocation"
                  name="subLocation"
                  defaultValue={editing?.subLocation ?? ""}
                  placeholder={t("subLocationPlaceholder")}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryDate">{tc("inventory")}</Label>
              <Input
                id="inventoryDate"
                name="inventoryDate"
                type="date"
                defaultValue={editing?.inventoryDate ?? ""}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? tc("saving")
                  : editing
                    ? tc("saveChanges")
                    : t("createTool")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteBody", {
                id: deleteTarget?.localId ?? "",
                serial: deleteTarget?.serialNumber ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleteTarget ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? tc("deleting") : tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}
