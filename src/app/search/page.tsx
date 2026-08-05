import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SearchPage() {
  return (
    <AppShell
      currentPath="/search"
      title="Search"
      description="Global search by serial or part number">
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Increment 5.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
