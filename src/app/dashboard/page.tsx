import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AppShell
      currentPath="/dashboard"
      title="Dashboard"
      description="Overview of tools and custody status">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Total Tools", "In Stock", "Checked Out", "Overdue"].map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">—</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Coming in Increment 6
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
