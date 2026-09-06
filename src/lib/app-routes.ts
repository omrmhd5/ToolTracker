export type AppRouteMeta = {
  href: string;
  titleKey: string;
};

export const APP_ROUTE_META: AppRouteMeta[] = [
  { href: "/dashboard", titleKey: "dashboard" },
  { href: "/operations", titleKey: "operations" },
  { href: "/tools-by-customer", titleKey: "toolsByCustomer" },
  { href: "/history", titleKey: "history" },
  { href: "/admin/tools", titleKey: "adminTools" },
  { href: "/admin/customers", titleKey: "adminCustomers" },
  { href: "/admin/users", titleKey: "adminUsers" },
];

export function getRouteMeta(pathname: string): AppRouteMeta {
  const match = APP_ROUTE_META.find(
    (route) =>
      pathname === route.href || pathname.startsWith(`${route.href}/`),
  );

  return match ?? { href: pathname, titleKey: "dashboard" };
}
