import { Suspense } from "react";
import { getCheckoutHistory } from "@/actions/history";
import { AppShell } from "@/components/app-shell";
import { HistoryManager } from "@/components/history-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

type SearchParams = Promise<{
  q?: string;
  customer?: string;
  from?: string;
  to?: string;
  page?: string;
}>;

async function HistoryContent({
  searchParams,
  isAdmin,
}: {
  searchParams: SearchParams;
  isAdmin: boolean;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getCheckoutHistory({
    q: params.q,
    customer: params.customer,
    from: params.from,
    to: params.to,
    page,
  });

  return <HistoryManager {...data} isAdmin={isAdmin} />;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <AppShell
      currentPath="/history"
      title="History"
      description="Audit log of all checkouts and returns">
      <Card>
        <CardHeader>
          <CardTitle>Checkout history</CardTitle>
          <CardDescription>
            Filter by tool, customer, or checkout date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">
                Loading history...
              </p>
            }>
            <HistoryContent searchParams={searchParams} isAdmin={isAdmin} />
          </Suspense>
        </CardContent>
      </Card>
    </AppShell>
  );
}
