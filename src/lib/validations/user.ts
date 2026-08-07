import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "user"]),
});

export const updateUserSchema = z.object({
  id: z.uuid(),
  email: z.email().max(255),
  name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "user"]),
  isActive: z.boolean(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
