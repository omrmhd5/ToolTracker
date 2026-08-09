"use server";

import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkoutLogs, tools } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { createToolSchema, updateToolSchema } from "@/lib/validations/tool";
import type { ActionResult } from "@/lib/utils";

async function getNextToolNumber(): Promise<number> {
  const [row] = await db
    .select({
      maxSeq: sql<number>`coalesce(max(${tools.seq}), 0)`,
      total: sql<number>`count(*)::int`,
    })
    .from(tools);

  const maxSeq = Number(row?.maxSeq ?? 0);
  const total = Number(row?.total ?? 0);

  if (maxSeq > 0) {
    return maxSeq + 1;
  }

  return total + 1;
}

export async function peekNextToolNumber() {
  await requireAdmin();
  return getNextToolNumber();
}

export async function getTools(filters?: {
  status?: "IN" | "OUT" | "ALL";
  q?: string;
}) {
  await requireAdmin();

  const conditions = [];

  if (filters?.status && filters.status !== "ALL") {
    conditions.push(eq(tools.status, filters.status));
  }

  if (filters?.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(tools.localId, term),
        ilike(tools.nsn, term),
        ilike(tools.partNumber, term),
        ilike(tools.serialNumber, term),
        ilike(tools.nomenclature, term),
        ilike(tools.commonName, term),
        ilike(tools.location, term),
        ilike(tools.subLocation, term),
        sql`cast(${tools.seq} as text) ilike ${term}`,
        sql`cast(${tools.authqty} as text) ilike ${term}`,
        sql`cast(${tools.assignedqty} as text) ilike ${term}`,
        sql`cast(${tools.status} as text) ilike ${term}`,
        sql`cast(${tools.inventoryDate} as text) ilike ${term}`,
      ),
    );
  }

  const baseQuery = db
    .select({
      localId: tools.localId,
      seq: tools.seq,
      nsn: tools.nsn,
      partNumber: tools.partNumber,
      serialNumber: tools.serialNumber,
      nomenclature: tools.nomenclature,
      commonName: tools.commonName,
      authqty: tools.authqty,
      assignedqty: tools.assignedqty,
      location: tools.location,
      subLocation: tools.subLocation,
      inventoryDate: tools.inventoryDate,
      status: tools.status,
      custodyExpectedReturn: checkoutLogs.expectedReturnAt,
    })
    .from(tools)
    .leftJoin(
      checkoutLogs,
      and(
        eq(checkoutLogs.toolLocalId, tools.localId),
        isNull(checkoutLogs.checkedInAt),
      ),
    );

  if (conditions.length > 0) {
    return baseQuery.where(and(...conditions)).orderBy(tools.seq);
  }

  return baseQuery.orderBy(tools.seq);
}

export async function createTool(
  input: unknown,
): Promise<ActionResult<{ localId: string }>> {
  await requireAdmin();

  const parsed = createToolSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  const [existingLocalId] = await db
    .select({ localId: tools.localId })
    .from(tools)
    .where(eq(tools.localId, data.localId.trim()))
    .limit(1);

  if (existingLocalId) {
    return {
      success: false,
      error: "A tool with this local ID already exists",
    };
  }

  const [existingSerial] = await db
    .select({ localId: tools.localId })
    .from(tools)
    .where(eq(tools.serialNumber, data.serialNumber.trim()))
    .limit(1);

  if (existingSerial) {
    return {
      success: false,
      error: "A tool with this serial number already exists",
    };
  }

  await db.insert(tools).values({
    localId: data.localId.trim(),
    seq: await getNextToolNumber(),
    nsn: data.nsn?.trim() || null,
    partNumber: data.partNumber.trim(),
    serialNumber: data.serialNumber.trim(),
    nomenclature: data.nomenclature?.trim() || null,
    commonName: data.commonName?.trim() || null,
    authqty: data.authqty ?? 1,
    assignedqty: 0,
    location: data.location?.trim() || null,
    subLocation: data.subLocation?.trim() || null,
    inventoryDate: data.inventoryDate ?? null,
    status: "IN",
  });

  revalidatePath("/admin/tools");

  return { success: true, data: { localId: data.localId.trim() } };
}

export async function updateTool(
  originalLocalId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateToolSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(tools)
    .where(eq(tools.localId, originalLocalId))
    .limit(1);

  if (!existing) {
    return { success: false, error: "Tool not found" };
  }

  if (data.localId.trim() !== originalLocalId) {
    return { success: false, error: "Local ID cannot be changed" };
  }

  const [existingSerial] = await db
    .select({ localId: tools.localId })
    .from(tools)
    .where(eq(tools.serialNumber, data.serialNumber.trim()))
    .limit(1);

  if (existingSerial && existingSerial.localId !== originalLocalId) {
    return {
      success: false,
      error: "A tool with this serial number already exists",
    };
  }

  const isOut = existing.status === "OUT";

  await db
    .update(tools)
    .set({
      nsn: data.nsn?.trim() || null,
      partNumber: data.partNumber.trim(),
      serialNumber: data.serialNumber.trim(),
      nomenclature: data.nomenclature?.trim() || null,
      commonName: data.commonName?.trim() || null,
      authqty: data.authqty ?? existing.authqty,
      location: data.location?.trim() || null,
      subLocation: data.subLocation?.trim() || null,
      inventoryDate: data.inventoryDate ?? null,
      assignedqty: isOut ? existing.assignedqty : 0,
      status: isOut ? existing.status : "IN",
      updatedAt: new Date(),
    })
    .where(eq(tools.localId, originalLocalId));

  revalidatePath("/admin/tools");

  return { success: true };
}

export async function deleteTool(localId: string): Promise<ActionResult> {
  await requireAdmin();

  const [existing] = await db
    .select()
    .from(tools)
    .where(eq(tools.localId, localId))
    .limit(1);
  if (!existing) {
    return { success: false, error: "Tool not found" };
  }

  const [openCheckout] = await db
    .select({ id: checkoutLogs.id })
    .from(checkoutLogs)
    .where(
      and(
        eq(checkoutLogs.toolLocalId, localId),
        isNull(checkoutLogs.checkedInAt),
      ),
    )
    .limit(1);

  if (openCheckout || existing.status === "OUT") {
    return {
      success: false,
      error:
        "Cannot delete a tool that is currently checked out. Check it in first.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(checkoutLogs).where(eq(checkoutLogs.toolLocalId, localId));
    await tx.delete(tools).where(eq(tools.localId, localId));
  });

  revalidatePath("/admin/tools");

  return { success: true };
}
