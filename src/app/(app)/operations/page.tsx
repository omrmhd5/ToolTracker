import { Suspense } from "react";
import { getToolsForOperations } from "@/actions/checkout";
import { ToolOperationsManager } from "@/components/tool-operations-manager";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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

  const data = await getToolsForOperations({ status, q: params.q, page });

  return <ToolOperationsManager {...data} />;
}

export default function OperationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Browse tools in sequence. Search any field, filter by status, and
          check tools in or out.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label="Loading tools" />}>
          <OperationsContent searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
