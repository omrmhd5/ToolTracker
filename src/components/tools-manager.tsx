"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
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

export function ToolsManager({ tools }: { tools: ToolRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<ToolRow | null>(null);
  const [editing, setEditing] = useState<ToolRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ToolRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextNumber, setNextNumber] = useState<number | null>(null);

  const statusFilter = searchParams.get("status") ?? "ALL";
  const searchQuery = searchParams.get("q") ?? "";

  function applyFilters(status: string, q: string) {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
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
      return;
    }

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
      setDeleteTarget(null);
      return;
    }

    setDeleteTarget(null);
    setError(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              applyFilters(statusFilter, formData.get("q") as string);
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
              onValueChange={(value) => applyFilters(value, searchQuery)}>
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
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add tool
        </Button>
      </div>

      {error && !open && !deleteTarget ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {tools.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tools found. Add a tool or adjust your filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Local ID</th>
                <th className="px-4 py-3 text-left font-medium">Part number</th>
                <th className="px-4 py-3 text-left font-medium">
                  Serial number
                </th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">
                  Location/sub
                </th>
                <th className="px-4 py-3 text-left font-medium">Inventory</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
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
                    {formatDate(tool.inventoryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={tool.status === "IN" ? "success" : "warning"}>
                      {tool.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View"
                        onClick={() => openView(tool)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => openEdit(tool)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete"
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

      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tool details</DialogTitle>
            <DialogDescription>
              {viewing?.serialNumber} — {viewing?.partNumber}
            </DialogDescription>
          </DialogHeader>
          {viewing ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <DetailItem label="#" value={viewing.seq ?? "—"} />
              <DetailItem label="Local ID" value={viewing.localId} />
              <DetailItem label="NSN" value={viewing.nsn || "—"} />
              <DetailItem label="Part number" value={viewing.partNumber} />
              <DetailItem label="Serial number" value={viewing.serialNumber} />
              <DetailItem
                label="Nomenclature"
                value={viewing.nomenclature || "—"}
              />
              <DetailItem
                label="Common name"
                value={viewing.commonName || "—"}
              />
              <DetailItem label="Auth qty" value={viewing.authqty} />
              <DetailItem label="Assigned qty" value={viewing.assignedqty} />
              <DetailItem label="Location" value={viewing.location || "—"} />
              <DetailItem
                label="Sub-location"
                value={viewing.subLocation || "—"}
              />
              <DetailItem
                label="Status"
                value={
                  <Badge
                    variant={viewing.status === "IN" ? "success" : "warning"}>
                    {viewing.status}
                  </Badge>
                }
              />
              <DetailItem
                label="Custody"
                value={
                  viewing.custodyExpectedReturn
                    ? formatDate(viewing.custodyExpectedReturn)
                    : "—"
                }
              />
              <DetailItem
                label="Inventory"
                value={formatDate(viewing.inventoryDate)}
              />
            </dl>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing ? (
              <Button
                onClick={() => {
                  setViewing(null);
                  openEdit(viewing);
                }}>
                Edit tool
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit tool" : "Add tool"}</DialogTitle>
            <DialogDescription>
              One row per physical tool. Local ID is the primary key and cannot
              be changed after creation. The # column is assigned automatically
              in sequence.
              {editing?.status === "OUT"
                ? " This tool is checked out — only details and location can be updated."
                : null}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>#</Label>
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
                <Label htmlFor="localId">Local ID</Label>
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
              <Label htmlFor="nsn">NSN</Label>
              <Input
                id="nsn"
                name="nsn"
                defaultValue={editing?.nsn ?? ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partNumber">Part number</Label>
              <Input
                id="partNumber"
                name="partNumber"
                defaultValue={editing?.partNumber ?? ""}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial number</Label>
              <Input
                id="serialNumber"
                name="serialNumber"
                defaultValue={editing?.serialNumber ?? ""}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomenclature">Nomenclature</Label>
              <Input
                id="nomenclature"
                name="nomenclature"
                defaultValue={editing?.nomenclature ?? ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commonName">Common name</Label>
              <Input
                id="commonName"
                name="commonName"
                defaultValue={editing?.commonName ?? ""}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authqty">Auth qty</Label>
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={editing?.location ?? ""}
                  placeholder="Shelf A"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subLocation">Sub-location</Label>
                <Input
                  id="subLocation"
                  name="subLocation"
                  defaultValue={editing?.subLocation ?? ""}
                  placeholder="Bin 3"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventoryDate">Inventory</Label>
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
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : "Create tool"}
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
            <AlertDialogTitle>Delete tool?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete tool {deleteTarget?.localId} (
              {deleteTarget?.serialNumber}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && deleteTarget ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
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
