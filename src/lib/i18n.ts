import { cookies } from "next/headers";
import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

export type AppLocale = "en" | "ar";

const messages = {
  en: enMessages,
  ar: arMessages,
} as const;

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "en" || value === "ar";
}

export async function getRequestLocale(): Promise<AppLocale> {
  const store = await cookies();
  const cookie = store.get("language")?.value;
  return isAppLocale(cookie) ? cookie : "en";
}

function lookup(source: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);

  return typeof value === "string" ? value : undefined;
}

export function translate(locale: AppLocale, key: string): string {
  return lookup(messages[locale], key) ?? lookup(messages.en, key) ?? key;
}

export async function tError(key: string): Promise<string> {
  return translate(await getRequestLocale(), key);
}

export async function tUi(key: string): Promise<string> {
  return translate(await getRequestLocale(), key);
}

export async function tZod(message?: string): Promise<string> {
  return zodIssueMessage(
    await getRequestLocale(),
    message ?? "errors.invalidInput",
  );
}

export function zodIssueMessage(locale: AppLocale, message: string) {
  if (message.startsWith("validation.") || message.startsWith("errors.")) {
    return translate(locale, message);
  }
  return translate(locale, "errors.invalidInput");
}
