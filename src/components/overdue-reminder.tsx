import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getOverdueReminder } from "@/actions/dashboard";
import { formatDate } from "@/lib/utils";

export async function OverdueReminder() {
  const { count, items } = await getOverdueReminder();

  if (count === 0) {
    return null;
  }

  const remaining = count - items.length;

  return (
    <div
      role="status"
      className="border-b border-destructive/20 bg-destructive/10 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-destructive">
              {count} {count === 1 ? "tool is" : "tools are"} overdue for return
            </p>
            <ul className="text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item.logId}>
                  {item.toolLocalId} ({item.serialNumber}) — {item.customerName}
                  , due {formatDate(item.expectedReturnAt)}
                </li>
              ))}
              {remaining > 0 ? (
                <li>and {remaining} more overdue checkout(s)</li>
              ) : null}
            </ul>
          </div>
        </div>
        <Link
          href="/operations?status=OUT"
          className="shrink-0 text-sm font-medium text-destructive underline-offset-4 hover:underline">
          View checked-out tools
        </Link>
      </div>
    </div>
  );
}
