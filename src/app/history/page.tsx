import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <AppShell
      currentPath="/history"
      title="History"
      description="Audit log of all checkouts">
      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Increment 6.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
