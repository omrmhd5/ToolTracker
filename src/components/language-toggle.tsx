"use client";

import { Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const { locale, setLocale } = useAppLocale();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("shrink-0", className)}
      onClick={() => setLocale(locale === "en" ? "ar" : "en")}
      aria-label={t("toggleLanguage")}>
      <Globe className="h-4 w-4" />
    </Button>
  );
}
