import { auth } from "@/lib/auth";
import { AppShellLayout } from "@/components/app-shell-layout";
import { OverdueReminder } from "@/components/overdue-reminder";

export async function AppShell({
  children,
  currentPath,
  title,
  description,
}: {
  children: React.ReactNode;
  currentPath: string;
  title: string;
  description?: string;
}) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role: session.user.role ?? "user",
      }
    : null;

  return (
    <AppShellLayout
      currentPath={currentPath}
      title={title}
      description={description}
      user={user}
      isAdmin={session?.user?.role === "admin"}>
      <OverdueReminder />
      <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </AppShellLayout>
  );
}
