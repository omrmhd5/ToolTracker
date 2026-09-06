import { Suspense } from "react";
import { getCustomersWithCheckedOutTools } from "@/actions/customer-checkouts";
import { ToolsByCustomerManager } from "@/components/tools-by-customer-manager";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { tUi } from "@/lib/i18n";

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

export default async function ToolsByCustomerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const hint = await tUi("toolsByCustomer.hint");
  const loading = await tUi("common.loadingCustomers");

  return (
    <Card id="tools-by-customer-page">
      <CardHeader>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label={loading} />}>
          <ToolsByCustomerContent searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
