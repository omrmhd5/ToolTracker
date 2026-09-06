"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import { getRouteMeta } from "@/lib/app-routes";

type AppShellLayoutProps = {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  isAdmin: boolean;
  children: React.ReactNode;
};

const DRAWER_ANIMATION_MS = 240;

export function AppShellLayout({
  user,
  isAdmin,
  children,
}: AppShellLayoutProps) {
  const pathname = usePathname();
  const { title, description } = getRouteMeta(pathname);
  const [mobileNavMounted, setMobileNavMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => {
    setMobileNavMounted(true);
    requestAnimationFrame(() => setMobileNavOpen(true));
  }, []);

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
    window.setTimeout(() => setMobileNavMounted(false), DRAWER_ANIMATION_MS);
  }, []);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  useEffect(() => {
    document.body.style.overflow = mobileNavMounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavMounted]);

  useEffect(() => {
    if (!mobileNavMounted) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && mobileNavOpen) {
        closeMobileNav();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileNavMounted, mobileNavOpen, closeMobileNav]);

  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="hidden h-full w-64 shrink-0 border-r lg:block">
        <SidebarNav
          currentPath={pathname}
          user={user}
          isAdmin={isAdmin}
          className="h-full"
        />
      </aside>

      {mobileNavMounted ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close navigation"
            data-state={mobileNavOpen ? "open" : "closed"}
            className="ui-drawer-backdrop absolute inset-0 bg-black/50"
            onClick={closeMobileNav}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            data-state={mobileNavOpen ? "open" : "closed"}
            className="ui-drawer-panel relative flex h-full w-[min(100%,18rem)] max-w-xs shadow-xl">
            <SidebarNav
              currentPath={pathname}
              user={user}
              isAdmin={isAdmin}
              onNavigate={closeMobileNav}
              className="h-full w-full border-r"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-3"
              onClick={closeMobileNav}
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
            onClick={openMobileNav}
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
