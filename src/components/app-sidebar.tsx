import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRightLeft,
  History,
  LayoutDashboard,
  Package,
  Search,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/checkout", label: "Check Out", icon: ArrowRightLeft },
  { href: "/checkin", label: "Check In", icon: ArrowLeftRight },
  { href: "/history", label: "History", icon: History },
];

const adminNav = [
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/users", label: "Users", icon: Settings },
];

export function AppSidebar({ currentPath }: { currentPath: string }) {
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
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">v0.1 — Foundation</p>
      </div>
    </aside>
  );
}
