import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getUsers } from "@/actions/users";
import { UsersManager } from "@/components/users-manager";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { tUi } from "@/lib/i18n";

async function UsersContent({ currentUserId }: { currentUserId: string }) {
  const users = await getUsers();
  return <UsersManager users={users} currentUserId={currentUserId} />;
}

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const title = await tUi("adminUsers.title");
  const hint = await tUi("adminUsers.hint");
  const loading = await tUi("common.loadingUsers");

  return (
    <Card id="admin-users-page">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label={loading} />}>
          <UsersContent currentUserId={session.user.id} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
