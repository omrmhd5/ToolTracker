"use client";

import Link, { useLinkStatus } from "next/link";
import {
  ArrowRightLeft,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const mainNav = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/operations", labelKey: "checkInOut", icon: ArrowRightLeft },
  { href: "/tools-by-customer", labelKey: "toolsByCustomer", icon: UserCheck },
  { href: "/history", labelKey: "history", icon: History },
];

const adminNav = [
  { href: "/admin/tools", labelKey: "tools", icon: Wrench },
  { href: "/admin/customers", labelKey: "customers", icon: Users },
  { href: "/admin/users", labelKey: "users", icon: Settings },
];

type SidebarUser = {
  name: string;
  email: string;
  role: string;
};

function NavPendingIndicator() {
  const { pending } = useLinkStatus();

  if (!pending) return null;

  return (
    <span
      className="ml-auto h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-current"
      aria-hidden="true"
    />
  );
}

export function SidebarNav({
  currentPath,
  user,
  isAdmin,
  onNavigate,
  className,
}: {
  currentPath: string;
  user: SidebarUser | null;
  isAdmin: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const t = useTranslations("nav");
  const tApp = useTranslations("app");
  const tRoles = useTranslations("roles");

  function renderLink(item: (typeof mainNav)[number]) {
    const Icon = item.icon;
    const active =
      currentPath === item.href || currentPath.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none",
          active
            ? "bg-primary text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            : "ui-nav-link text-muted-foreground",
        )}>
        <Icon className="h-4 w-4 shrink-0" />
        {t(item.labelKey)}
        <NavPendingIndicator />
      </Link>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:h-16 sm:px-6">
        <AppLogo size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{tApp("name")}</p>
          <p className="truncate text-xs text-muted-foreground">
            {tApp("tagline")}
          </p>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("operations")}
        </p>
        {mainNav.map(renderLink)}

        {isAdmin ? (
          <>
            <Separator className="my-4" />
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("admin")}
            </p>
            {adminNav.map(renderLink)}
          </>
        ) : null}
      </nav>

      <div className="mt-auto shrink-0 space-y-3 border-t bg-card p-4">
        {user ? (
          <div className="min-w-0 px-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {user.role === "admin" ? tRoles("admin") : tRoles("user")}
            </p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </Button>
      </div>
    </div>
  );
}
