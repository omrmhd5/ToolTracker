import { z } from "zod";

export const createCustomerSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  specialization: z.string().min(1, "Specialization is required").max(255),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  id: z.uuid(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
