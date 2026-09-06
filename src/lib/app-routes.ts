export type AppRouteMeta = {
  href: string;
  title: string;
  description?: string;
};

export const APP_ROUTE_META: AppRouteMeta[] = [
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "Overview of tools and custody status",
  },
  {
    href: "/operations",
    title: "Check In / Out",
    description: "Check tools in and out of inventory",
  },
  {
    href: "/tools-by-customer",
    title: "Tools by Customer",
    description: "See which tools each customer currently has checked out",
  },
  {
    href: "/history",
    title: "History",
    description: "Audit log of all checkouts and returns",
  },
  {
    href: "/admin/tools",
    title: "Tools",
    description: "Manage tool inventory",
  },
  {
    href: "/admin/customers",
    title: "Customers",
    description: "Manage customer records",
  },
  {
    href: "/admin/users",
    title: "Users",
    description: "Manage user accounts",
  },
];

export function getRouteMeta(pathname: string): AppRouteMeta {
  const match = APP_ROUTE_META.find(
    (route) =>
      pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  return match ?? { href: pathname, title: "Tool Tracker" };
}
