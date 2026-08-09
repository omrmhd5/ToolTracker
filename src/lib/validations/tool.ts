import { z } from "zod";

function formString(schema: z.ZodString) {
  return z.preprocess((value) => (value == null ? "" : value), schema);
}

const optionalDate = formString(z.string()).transform((value) =>
  value.length > 0 ? value : undefined,
);

const toolFields = {
  localId: formString(z.string().min(1, "Local ID is required").max(100)),
  nsn: formString(z.string().max(100)),
  partNumber: formString(z.string().min(1, "Part number is required").max(100)),
  serialNumber: formString(
    z.string().min(1, "Serial number is required").max(100),
  ),
  nomenclature: formString(z.string().max(2000)),
  commonName: formString(z.string().max(2000)),
  authqty: z.coerce.number().int().min(0).default(1),
  location: formString(z.string().max(255)),
  subLocation: formString(z.string().max(255)),
  inventoryDate: optionalDate,
};

export const createToolSchema = z.object(toolFields);

export const updateToolSchema = z.object({
  ...toolFields,
  assignedqty: z.coerce.number().int().min(0).max(1).optional(),
  status: z.enum(["IN", "OUT"]).optional(),
});

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
