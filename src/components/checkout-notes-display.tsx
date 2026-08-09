import { parseCheckoutNotes } from "@/lib/utils";

export function CheckoutNotesDisplay({
  notes,
}: {
  notes: string | null | undefined;
}) {
  const { checkoutNote, checkInNote } = parseCheckoutNotes(notes);

  if (!checkoutNote && !checkInNote) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
      {checkoutNote ? (
        <div>
          <p className="font-medium">Check out</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {checkoutNote}
          </p>
        </div>
      ) : null}
      {checkInNote ? (
        <div>
          <p className="font-medium">Check-in</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {checkInNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
