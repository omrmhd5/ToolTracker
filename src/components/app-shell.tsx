import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { AppShellLayout } from "@/components/app-shell-layout";
import { OverdueReminder } from "@/components/overdue-reminder";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role ?? "user",
      }
    : null;

  return (
    <AppShellLayout user={user} isAdmin={session?.user?.role === "admin"}>
      <Suspense fallback={null}>
        <OverdueReminder />
      </Suspense>
      <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </AppShellLayout>
  );
}
