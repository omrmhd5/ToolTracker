import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminToolsPage() {
  return (
    <AppShell
      currentPath="/admin/tools"
      title="Tools"
      description="Manage tool inventory">
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
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
