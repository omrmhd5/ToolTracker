import { redirect } from "next/navigation";
import { getUsers } from "@/actions/users";
import { AppShell } from "@/components/app-shell";
import { UsersManager } from "@/components/users-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <AppShell
      currentPath="/admin/users"
      title="Users"
      description="Manage user accounts"
    >
      <Card>
        <CardHeader>
          <CardTitle>User accounts</CardTitle>
          <CardDescription>
            Create and manage login accounts. Deactivated users cannot sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersManager users={users} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
