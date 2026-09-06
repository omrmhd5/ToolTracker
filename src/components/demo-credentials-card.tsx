"use client";

import { useTranslations } from "next-intl";

const ACCOUNTS = [
  { role: "admin" as const, email: "admin@admin.com", password: "admin123" },
  { role: "user" as const, email: "user@user.com", password: "user123" },
];

export function DemoCredentialsCard() {
  const t = useTranslations("login");
  const tRoles = useTranslations("roles");

  return (
    <div
      id="demo-credentials"
      className="w-full max-w-md rounded-xl border bg-card p-4 text-sm shadow-sm">
      <p className="font-semibold">{t("demoTitle")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("demoHint")}</p>
      <div className="mt-3 space-y-2">
        {ACCOUNTS.map((account) => (
          <div
            key={account.role}
            className="flex flex-col gap-0.5 rounded-md bg-muted/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">{tRoles(account.role)}</span>
            <span className="select-all font-mono text-xs sm:text-sm">
              {account.email} / {account.password}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
