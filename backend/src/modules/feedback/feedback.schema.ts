import { z } from "zod";

export const submitFeedbackSchema = z.object({
  content: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(2000, "Feedback must be at most 2000 characters"),
  category: z.enum(["bug", "feature", "general"]).default("general"),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export const updateFeedbackSchema = z.object({
  status: z.enum(["new", "reviewed", "resolved"]).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
