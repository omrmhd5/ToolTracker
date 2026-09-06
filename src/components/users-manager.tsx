"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { createUser, updateUser } from "@/actions/users";
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
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
};

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("adminUsers");
  const tc = useTranslations("common");
  const tLogin = useTranslations("login");
  const tRoles = useTranslations("roles");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [role, setRole] = useState<"admin" | "user">("user");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setRole("user");
    setIsActive(true);
    setError(null);
    setOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditing(user);
    setRole(user.role);
    setIsActive(user.isActive);
    setError(null);
    setOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const password = (formData.get("password") as string) || "";

    const result = editing
      ? await updateUser({
          id: editing.id,
          email,
          name,
          role,
          isActive,
          password,
        })
      : await createUser({
          email,
          name,
          role,
          password,
        });

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

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {t("addUser")}
        </Button>
      </div>

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tc("noUsers")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  {tc("name")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tc("email")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tc("role")}
                </th>
                <th className="px-4 py-3 text-left font-medium">
                  {tc("status")}
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
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}>
                      {tRoles(user.role)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "success" : "destructive"}>
                      {user.isActive ? tc("active") : tc("inactive")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(user.createdAt, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("editAria")}
                      onClick={() => openEdit(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editUser") : t("addUser")}</DialogTitle>
            <DialogDescription>
              {editing ? t("editHint") : t("createHint")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="email">{tc("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editing?.email ?? ""}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>{tc("role")}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as "admin" | "user")}
                disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{tRoles("user")}</SelectItem>
                  <SelectItem value="admin">{tRoles("admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editing ? (
              <div className="space-y-2">
                <Label>{tc("status")}</Label>
                <Select
                  value={isActive ? "true" : "false"}
                  onValueChange={(value) => setIsActive(value === "true")}
                  disabled={loading || editing.id === currentUserId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{tc("active")}</SelectItem>
                    <SelectItem value="false">{tc("inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="password">
                {editing ? t("newPassword") : tLogin("password")}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={!editing}
                disabled={loading}
                minLength={6}
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
                    : t("createUser")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
