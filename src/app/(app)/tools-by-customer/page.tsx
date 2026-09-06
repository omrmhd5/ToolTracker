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
    <Card>
      <CardHeader>
        <CardDescription>
          Browse customers and view their currently checked out tools.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label="Loading customers" />}>
          <ToolsByCustomerContent searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
