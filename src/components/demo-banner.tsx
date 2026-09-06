"use client";

import { useTranslations } from "next-intl";

export function DemoBanner() {
  const t = useTranslations("banner");

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] bg-amber-500 px-3 py-1.5 text-center text-xs font-semibold tracking-wide text-amber-950 sm:text-sm">
      {t("en")} · {t("ar")}
    </div>
  );
}
