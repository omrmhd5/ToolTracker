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
import { tUi } from "@/lib/i18n";

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

export default async function OperationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const hint = await tUi("operations.hint");
  const loading = await tUi("common.loadingTools");

  return (
    <Card id="operations-page">
      <CardHeader>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<PageLoading label={loading} />}>
          <OperationsContent searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
