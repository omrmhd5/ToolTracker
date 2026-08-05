import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckinPage() {
  return (
    <AppShell
      currentPath="/checkin"
      title="Check In"
      description="Return tools to inventory">
      <Card>
        <CardHeader>
          <CardTitle>Check In</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Increment 4.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
