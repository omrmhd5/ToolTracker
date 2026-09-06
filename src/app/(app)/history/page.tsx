import { Suspense } from "react";
import { getCheckoutHistory } from "@/actions/history";
import { HistoryManager } from "@/components/history-manager";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { tUi } from "@/lib/i18n";
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

  const hint = await tUi("history.hint");
  const loading = await tUi("common.loadingHistory");

  return (
    <Card id="history-page">
      <CardHeader>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label={loading} />}>
          <HistoryContent searchParams={searchParams} isAdmin={isAdmin} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
