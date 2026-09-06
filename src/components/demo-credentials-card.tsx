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
          <div key={account.role} className="rounded-md bg-muted/60 px-3 py-2">
            <span className="font-medium">{tRoles(account.role)}</span>
            <div className="mt-1 space-y-0.5 font-mono text-xs sm:text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-muted-foreground">{t("email")}</span>
                <span className="select-all">{account.email}</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-muted-foreground">{t("password")}</span>
                <span className="select-all">{account.password}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
