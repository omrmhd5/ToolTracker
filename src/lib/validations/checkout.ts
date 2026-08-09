import { z } from "zod";

function formString(schema: z.ZodString) {
  return z.preprocess((value) => (value == null ? "" : value), schema);
}

export const checkOutSchema = z.object({
  toolLocalId: formString(z.string().min(1, "Tool is required")),
  customerId: z.uuid("Customer is required"),
  expectedReturnAt: formString(
    z.string().min(1, "Expected return date is required"),
  ),
  notes: formString(z.string().max(2000)),
});

export const checkInSchema = z.object({
  toolLocalId: formString(z.string().min(1, "Tool is required")),
  notes: formString(z.string().max(2000)),
});

export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
