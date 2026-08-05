import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminCustomersPage() {
  return (
    <AppShell
      currentPath="/admin/customers"
      title="Customers"
      description="Manage customer records">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Increment 3.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
