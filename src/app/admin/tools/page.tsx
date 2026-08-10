import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTools } from "@/actions/tools";
import { AppShell } from "@/components/app-shell";
import { ToolsManager } from "@/components/tools-manager";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

async function ToolsContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status =
    params.status === "IN" || params.status === "OUT"
      ? params.status
      : ("ALL" as const);
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getTools({
    status,
    q: params.q,
    page,
  });

  return <ToolsManager {...data} />;
}

export default async function AdminToolsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <AppShell
      currentPath="/admin/tools"
      title="Tools"
      description="Manage tool inventory">
      <Card>
        <CardHeader>
          <CardDescription>
            One row per physical tool. Search any field or filter by status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PageLoading label="Loading tools" />}>
            <ToolsContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </AppShell>
  );
}
