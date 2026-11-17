import { z } from "zod";

export const todoFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or less")
    .optional()
    .default(""),
});

export type TodoFormInput = z.input<typeof todoFormSchema>;
