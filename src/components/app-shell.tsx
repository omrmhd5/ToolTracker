import { AppSidebar } from "@/components/app-sidebar";

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
  return (
    <div className="flex min-h-screen">
      <AppSidebar currentPath={currentPath} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center border-b bg-card px-8">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
