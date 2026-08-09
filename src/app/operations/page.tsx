import { Suspense } from "react";
import {
  getCustomersForCheckout,
  getToolsForOperations,
} from "@/actions/checkout";
import { AppShell } from "@/components/app-shell";
import { ToolOperationsManager } from "@/components/tool-operations-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
}>;

async function OperationsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status =
    params.status === "IN" || params.status === "OUT" || params.status === "ALL"
      ? params.status
      : "ALL";
  const page = Math.max(1, Number(params.page) || 1);

  const [data, customers] = await Promise.all([
    getToolsForOperations({ status, q: params.q, page }),
    getCustomersForCheckout(),
  ]);

  return <ToolOperationsManager {...data} customers={customers} />;
}

export default function OperationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AppShell
      currentPath="/operations"
      title="Check In / Out"
      description="Check tools in and out of inventory">
      <Card>
        <CardHeader>
          <CardTitle>Check In / Out</CardTitle>
          <CardDescription>
            Browse tools in sequence. Search any field, filter by status, and
            check tools in or out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Loading tools...</p>
            }>
            <OperationsContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </AppShell>
  );
}
