import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutPage() {
  return (
    <AppShell
      currentPath="/checkout"
      title="Check Out"
      description="Assign tools to customers">
      <Card>
        <CardHeader>
          <CardTitle>Check Out</CardTitle>
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
