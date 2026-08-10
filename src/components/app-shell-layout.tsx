"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";

type AppShellLayoutProps = {
  currentPath: string;
  title: string;
  description?: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  isAdmin: boolean;
  children: React.ReactNode;
};

export function AppShellLayout({
  currentPath,
  title,
  description,
  user,
  isAdmin,
  children,
}: AppShellLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [currentPath]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden h-full w-64 shrink-0 border-r lg:block">
        <SidebarNav
          currentPath={currentPath}
          user={user}
          isAdmin={isAdmin}
          className="h-full"
        />
      </aside>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-[min(100%,18rem)] max-w-xs shadow-xl">
            <SidebarNav
              currentPath={currentPath}
              user={user}
              isAdmin={isAdmin}
              onNavigate={() => setMobileNavOpen(false)}
              className="h-full w-full border-r"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu">
              <X className="h-5 w-5" />
            </Button>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex min-h-14 shrink-0 items-center gap-3 border-b bg-card px-4 py-3 sm:min-h-16 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
