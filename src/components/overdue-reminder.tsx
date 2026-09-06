import { getOverdueReminder } from "@/actions/dashboard";
import { formatDate } from "@/lib/utils";
import { getRequestLocale, translate } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export async function OverdueReminder() {
  const { count, items } = await getOverdueReminder();

  if (count === 0) {
    return null;
  }

  const locale = await getRequestLocale();
  const remaining = count - items.length;
  const heading =
    count === 1
      ? translate(locale, "overdue.one").replace("{count}", String(count))
      : translate(locale, "overdue.other").replace("{count}", String(count));

  return (
    <div
      role="alert"
      aria-live="polite"
      className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p
              id="overdue-reminder-heading"
              className="text-sm font-medium text-destructive">
              {heading}
            </p>
            <ul className="text-sm text-destructive/80">
              {items.map((item) => (
                <li key={item.logId}>
                  {item.toolLocalId} ({item.serialNumber}) — {item.customerName}
                  , {translate(locale, "dashboard.due").replace("{date}", formatDate(item.expectedReturnAt, locale))}
                </li>
              ))}
              {remaining > 0 ? (
                <li>
                  {translate(locale, "overdue.andMore").replace(
                    "{count}",
                    String(remaining),
                  )}
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <Link
          href="/operations?status=OUT"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-destructive underline-offset-4 hover:underline">
          {translate(locale, "overdue.viewCheckedOut")}
        </Link>
      </div>
    </div>
  );
}
