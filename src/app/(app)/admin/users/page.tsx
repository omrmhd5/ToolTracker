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

async function UsersContent({ currentUserId }: { currentUserId: string }) {
  const users = await getUsers();
  return <UsersManager users={users} currentUserId={currentUserId} />;
}

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User accounts</CardTitle>
        <CardDescription>
          Create and manage login accounts. Deactivated users cannot sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label="Loading users" />}>
          <UsersContent currentUserId={session.user.id} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
