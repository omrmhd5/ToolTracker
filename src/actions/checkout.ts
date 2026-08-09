"use server";

import { and, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkoutLogs, customers, tools } from "@/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { checkInSchema, checkOutSchema } from "@/lib/validations/checkout";
import type { ActionResult } from "@/lib/utils";

const PAGE_SIZE = 20;
const CUSTOMER_PAGE_SIZE = 10;

function buildSearchCondition(term: string) {
  const pattern = `%${term}%`;
  return or(
    ilike(tools.localId, pattern),
    ilike(tools.nsn, pattern),
    ilike(tools.partNumber, pattern),
    ilike(tools.serialNumber, pattern),
    ilike(tools.nomenclature, pattern),
    ilike(tools.commonName, pattern),
    ilike(tools.location, pattern),
    ilike(tools.subLocation, pattern),
    sql`cast(${tools.seq} as text) ilike ${pattern}`,
    sql`cast(${tools.authqty} as text) ilike ${pattern}`,
    sql`cast(${tools.assignedqty} as text) ilike ${pattern}`,
    sql`cast(${tools.status} as text) ilike ${pattern}`,
    sql`cast(${tools.inventoryDate} as text) ilike ${pattern}`,
    ilike(customers.employeeId, pattern),
    ilike(customers.name, pattern),
    ilike(customers.specialization, pattern),
  );
}

function buildWhereClause(filters?: {
  status?: "IN" | "OUT" | "ALL";
  q?: string;
}) {
  const conditions = [];

  if (filters?.status && filters.status !== "ALL") {
    conditions.push(eq(tools.status, filters.status));
  }

  if (filters?.q?.trim()) {
    conditions.push(buildSearchCondition(filters.q.trim()));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function getToolsForOperations(filters?: {
  status?: "IN" | "OUT" | "ALL";
  q?: string;
  page?: number;
}) {
  await requireAuth();

  const page = Math.max(1, filters?.page ?? 1);
  const whereClause = buildWhereClause(filters);
  const offset = (page - 1) * PAGE_SIZE;

  const baseFrom = db
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
      checkoutLogId: checkoutLogs.id,
      customerId: customers.id,
      customerEmployeeId: customers.employeeId,
      customerName: customers.name,
      customerSpecialization: customers.specialization,
      checkedOutAt: checkoutLogs.checkedOutAt,
      expectedReturnAt: checkoutLogs.expectedReturnAt,
      notes: sql<string | null>`
        CASE
          WHEN ${tools.status} = 'OUT' THEN ${checkoutLogs.notes}
          ELSE (
            SELECT cl.notes
            FROM checkout_logs cl
            WHERE cl.tool_local_id = ${tools.localId}
              AND cl.notes IS NOT NULL
              AND btrim(cl.notes) <> ''
            ORDER BY cl.checked_out_at DESC
            LIMIT 1
          )
        END
      `,
    })
    .from(tools)
    .leftJoin(
      checkoutLogs,
      and(
        eq(checkoutLogs.toolLocalId, tools.localId),
        isNull(checkoutLogs.checkedInAt),
      ),
    )
    .leftJoin(customers, eq(checkoutLogs.customerId, customers.id));

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(tools)
    .leftJoin(
      checkoutLogs,
      and(
        eq(checkoutLogs.toolLocalId, tools.localId),
        isNull(checkoutLogs.checkedInAt),
      ),
    )
    .leftJoin(customers, eq(checkoutLogs.customerId, customers.id));

  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = whereClause
    ? await baseFrom
        .where(whereClause)
        .orderBy(tools.seq)
        .limit(PAGE_SIZE)
        .offset(offset)
    : await baseFrom.orderBy(tools.seq).limit(PAGE_SIZE).offset(offset);

  return {
    tools: rows,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

export async function searchCustomersForCheckout(filters?: {
  q?: string;
  page?: number;
}) {
  await requireAuth();

  const page = Math.max(1, filters?.page ?? 1);
  const offset = (page - 1) * CUSTOMER_PAGE_SIZE;
  const conditions = [];

  if (filters?.q?.trim()) {
    const pattern = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(customers.employeeId, pattern),
        ilike(customers.name, pattern),
        ilike(customers.specialization, pattern),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const baseSelect = db
    .select({
      id: customers.id,
      employeeId: customers.employeeId,
      name: customers.name,
      specialization: customers.specialization,
    })
    .from(customers);

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers);

  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / CUSTOMER_PAGE_SIZE));

  const rows = whereClause
    ? await baseSelect
        .where(whereClause)
        .orderBy(customers.name)
        .limit(CUSTOMER_PAGE_SIZE)
        .offset(offset)
    : await baseSelect
        .orderBy(customers.name)
        .limit(CUSTOMER_PAGE_SIZE)
        .offset(offset);

  return {
    customers: rows,
    total,
    page,
    pageSize: CUSTOMER_PAGE_SIZE,
    totalPages,
  };
}

export type CustomerOption = Awaited<
  ReturnType<typeof searchCustomersForCheckout>
>["customers"][number];

export async function checkOutTool(
  input: unknown,
): Promise<ActionResult<{ checkoutLogId: string }>> {
  const session = await requireAuth();

  const parsed = checkOutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, data.customerId))
    .limit(1);

  if (!customer) {
    return { success: false, error: "Customer not found" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [tool] = await tx
        .select()
        .from(tools)
        .where(eq(tools.localId, data.toolLocalId))
        .limit(1);

      if (!tool) {
        throw new Error("Tool not found");
      }

      if (tool.status !== "IN") {
        throw new Error("This tool is already checked out");
      }

      const [openLog] = await tx
        .select({ id: checkoutLogs.id })
        .from(checkoutLogs)
        .where(
          and(
            eq(checkoutLogs.toolLocalId, data.toolLocalId),
            isNull(checkoutLogs.checkedInAt),
          ),
        )
        .limit(1);

      if (openLog) {
        throw new Error("This tool already has an open checkout record");
      }

      const [log] = await tx
        .insert(checkoutLogs)
        .values({
          toolLocalId: data.toolLocalId,
          customerId: data.customerId,
          checkedOutBy: session.user.id,
          expectedReturnAt: data.expectedReturnAt,
          notes: data.notes?.trim() || null,
        })
        .returning({ id: checkoutLogs.id });

      await tx
        .update(tools)
        .set({
          status: "OUT",
          assignedqty: 1,
          updatedAt: new Date(),
        })
        .where(eq(tools.localId, data.toolLocalId));

      return log;
    });

    revalidatePath("/operations");
    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath("/admin/tools");

    return { success: true, data: { checkoutLogId: result.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Checkout failed",
    };
  }
}

export async function checkInTool(input: unknown): Promise<ActionResult> {
  const session = await requireAuth();

  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [tool] = await tx
        .select()
        .from(tools)
        .where(eq(tools.localId, data.toolLocalId))
        .limit(1);

      if (!tool) {
        throw new Error("Tool not found");
      }

      if (tool.status !== "OUT") {
        throw new Error("This tool is not checked out");
      }

      const [openLog] = await tx
        .select({ id: checkoutLogs.id, notes: checkoutLogs.notes })
        .from(checkoutLogs)
        .where(
          and(
            eq(checkoutLogs.toolLocalId, data.toolLocalId),
            isNull(checkoutLogs.checkedInAt),
          ),
        )
        .limit(1);

      if (!openLog) {
        throw new Error("No open checkout record found for this tool");
      }

      const checkInNotes = data.notes?.trim();
      const updatedNotes = checkInNotes
        ? openLog.notes
          ? `${openLog.notes}\nCheck-in: ${checkInNotes}`
          : checkInNotes
        : openLog.notes;

      await tx
        .update(checkoutLogs)
        .set({
          checkedInAt: new Date(),
          checkedInBy: session.user.id,
          ...(checkInNotes ? { notes: updatedNotes } : {}),
        })
        .where(eq(checkoutLogs.id, openLog.id));

      await tx
        .update(tools)
        .set({
          status: "IN",
          assignedqty: 0,
          updatedAt: new Date(),
        })
        .where(eq(tools.localId, data.toolLocalId));
    });

    revalidatePath("/operations");
    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath("/admin/tools");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Check-in failed",
    };
  }
}

export type ToolOperationRow = Awaited<
  ReturnType<typeof getToolsForOperations>
>["tools"][number];
