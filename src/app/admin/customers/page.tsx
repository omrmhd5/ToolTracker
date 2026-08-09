import { redirect } from "next/navigation";
import { getCustomers } from "@/actions/customers";
import { AppShell } from "@/components/app-shell";
import { CustomersManager } from "@/components/customers-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function AdminCustomersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const customers = await getCustomers();

  return (
    <AppShell
      currentPath="/admin/customers"
      title="Customers"
      description="Manage customer records">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            People who receive tools. Employee ID must be unique.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomersManager customers={customers} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
