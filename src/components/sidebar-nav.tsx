"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/operations", label: "Check In / Out", icon: ArrowRightLeft },
  { href: "/tools-by-customer", label: "Tools by Customer", icon: UserCheck },
  { href: "/history", label: "History", icon: History },
];

const adminNav = [
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/users", label: "Users", icon: Settings },
];

type SidebarUser = {
  name: string;
  email: string;
  role: string;
};

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
        {item.label}
      </Link>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-card", className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:h-16 sm:px-6">
        <Package className="h-6 w-6 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Tool Tracker</p>
          <p className="truncate text-xs text-muted-foreground">
            Inventory system
          </p>
        </div>
      </div>

      <nav
        aria-label="Main navigation"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Operations
        </p>
        {mainNav.map(renderLink)}

        {isAdmin ? (
          <>
            <Separator className="my-4" />
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin
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
              {user.role}
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
          Sign out
        </Button>
      </div>
    </div>
  );
}
