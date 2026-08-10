import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCustomers } from "@/actions/customers";
import { AppShell } from "@/components/app-shell";
import { CustomersManager } from "@/components/customers-manager";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

type SearchParams = Promise<{ q?: string; page?: string }>;

async function CustomersContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const data = await getCustomers({
    q: params.q,
    page,
  });

  return <CustomersManager {...data} />;
}

export default async function AdminCustomersPage({
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
      currentPath="/admin/customers"
      title="Customers"
      description="Manage customer records">
      <Card>
        <CardHeader>
          <CardDescription>
            People who receive tools. Employee ID must be unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<PageLoading label="Loading customers" />}>
            <CustomersContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </AppShell>
  );
}
