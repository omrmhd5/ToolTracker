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
import { signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";
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

export async function AppSidebar({ currentPath }: { currentPath: string }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Package className="h-6 w-6 text-primary" />
        <div>
          <p className="text-sm font-semibold">Tool Tracker</p>
          <p className="text-xs text-muted-foreground">Inventory system</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Operations
        </p>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active =
            currentPath === item.href ||
            currentPath.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin ? (
          <>
            <Separator className="my-4" />
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Admin
            </p>
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active =
                currentPath === item.href ||
                currentPath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        ) : null}
      </nav>

      <div className="space-y-3 border-t p-4">
        {session?.user ? (
          <div className="px-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {session.user.email}
            </p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {session.user.role}
            </p>
          </div>
        ) : null}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
