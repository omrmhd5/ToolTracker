"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/actions/customers";
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
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

const BASE_PATH = "/admin/customers";

type CustomerRow = {
  id: string;
  employeeId: string;
  name: string;
  specialization: string;
  createdAt: Date;
};

export function CustomersManager({
  customers,
  total,
  page,
  pageSize,
  totalPages,
}: {
  customers: CustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("adminCustomers");
  const tc = useTranslations("common");
  const tf = useTranslations("fields");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  function openCreate() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }

  function openEdit(customer: CustomerRow) {
    setEditing(customer);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      employeeId: formData.get("employeeId") as string,
      name: formData.get("name") as string,
      specialization: formData.get("specialization") as string,
    };

    const result = editing
      ? await updateCustomer({ id: editing.id, ...payload })
      : await createCustomer(payload);

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
    const result = await deleteCustomer(deleteTarget.id);
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
        <form
          className="flex w-full flex-col gap-2 sm:flex-row sm:items-end lg:flex-1"
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
              placeholder={tc("searchCustomersPlaceholder")}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="mt-auto shrink-0">
            {tc("search")}
          </Button>
        </form>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4" />
          {t("addCustomer")}
        </Button>
      </div>

      {error && !open && !deleteTarget ? (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      ) : null}

      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noCustomersFound")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  {tf("employeeId")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tc("name")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tf("specialization")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tc("created")}
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  {tc("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {customer.employeeId}
                  </td>
                  <td className="px-4 py-3">{customer.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {customer.specialization}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(customer.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("editAria")}
                        onClick={() => openEdit(customer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("deleteAria")}
                        onClick={() => {
                          setError(null);
                          setDeleteTarget(customer);
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

      {customers.length > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editCustomer") : t("addCustomer")}
            </DialogTitle>
            <DialogDescription>{t("formHint")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">{tf("employeeId")}</Label>
              <Input
                id="employeeId"
                name="employeeId"
                defaultValue={editing?.employeeId ?? ""}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{tc("name")}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name ?? ""}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">{tf("specialization")}</Label>
              <Input
                id="specialization"
                name="specialization"
                defaultValue={editing?.specialization ?? ""}
                required
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
                    : t("createCustomer")}
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
              {t("deleteBody", { name: deleteTarget?.name ?? "" })}
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
