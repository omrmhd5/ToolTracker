import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isOverdue(expectedReturnAt: string | Date | null | undefined) {
  if (!expectedReturnAt) return false;
  const expected =
    typeof expectedReturnAt === "string"
      ? new Date(expectedReturnAt)
      : expectedReturnAt;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expected.setHours(0, 0, 0, 0);
  return expected < today;
}

export function daysUntilDue(
  expectedReturnAt: string | Date | null | undefined,
) {
  if (!expectedReturnAt) return null;
  const expected =
    typeof expectedReturnAt === "string"
      ? new Date(expectedReturnAt)
      : expectedReturnAt;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expected.setHours(0, 0, 0, 0);
  return Math.round(
    (expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

const CHECK_IN_NOTE_MARKER = "\nCheck-in: ";

export function parseCheckoutNotes(notes: string | null | undefined) {
  if (!notes?.trim()) {
    return { checkoutNote: null, checkInNote: null };
  }

  const index = notes.indexOf(CHECK_IN_NOTE_MARKER);

  if (index === -1) {
    return { checkoutNote: notes.trim(), checkInNote: null };
  }

  return {
    checkoutNote: notes.slice(0, index).trim() || null,
    checkInNote:
      notes.slice(index + CHECK_IN_NOTE_MARKER.length).trim() || null,
  };
}
