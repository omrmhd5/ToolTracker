import { Suspense } from "react";
import { getCustomersWithCheckedOutTools } from "@/actions/customer-checkouts";
import { AppShell } from "@/components/app-shell";
import { ToolsByCustomerManager } from "@/components/tools-by-customer-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SearchParams = Promise<{
  q?: string;
  page?: string;
}>;

async function ToolsByCustomerContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getCustomersWithCheckedOutTools({
    q: params.q,
    page,
  });

  return <ToolsByCustomerManager {...data} />;
}

export default function ToolsByCustomerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AppShell
      currentPath="/tools-by-customer"
      title="Tools by Customer"
      description="See which tools each customer currently has checked out">
      <Card>
        <CardHeader>
          <CardTitle>Tools by customer</CardTitle>
          <CardDescription>
            Browse customers and view their currently checked out tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">
                Loading customers...
              </p>
            }>
            <ToolsByCustomerContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </AppShell>
  );
}
