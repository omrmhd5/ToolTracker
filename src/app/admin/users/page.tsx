import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <AppShell
      currentPath="/admin/users"
      title="Users"
      description="Manage user accounts">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Increment 2.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
