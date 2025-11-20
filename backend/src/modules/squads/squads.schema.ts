
import { z } from 'zod';

/**
 * Squads module validation schemas.
 */
export const createSquadSchema = z.object({
  name: z.string()
    .min(1, "Squad name is required")
    .max(100, "Squad name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Squad name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  imageUrl: z.string()
    .url("Must be a valid URL")
    .optional(),
  maxMembers: z.number()
    .int("Max members must be a whole number")
    .min(2, "Squad must allow at least 2 members")
    .max(50, "Squad cannot have more than 50 members"),
  potEnabled: z.boolean().optional().default(false),
  potAmount: z.number()
    .min(0.01, "Pot amount must be at least $0.01")
    .max(10000, "Pot amount cannot exceed $10,000")
    .optional(),
  potDeadline: z.string()
    .datetime("Must be a valid datetime")
    .optional(),
});

export const joinSquadSchema = z.object({
  joinCode: z.string()
    .min(6, "Join code must be at least 6 characters")
    .max(12, "Join code must be at most 12 characters")
    .regex(/^[A-Z0-9]+$/, "Join code can only contain uppercase letters and numbers"),
});

export const updateSquadSchema = z.object({
  name: z.string()
    .min(1, "Squad name is required")
    .max(100, "Squad name must be 100 characters or less")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Squad name can only contain letters, numbers, spaces, hyphens, and underscores")
    .optional(),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  imageUrl: z.string()
    .url("Must be a valid URL")
    .optional(),
  maxMembers: z.number()
    .int("Max members must be a whole number")
    .min(2, "Squad must allow at least 2 members")
    .max(50, "Squad cannot have more than 50 members")
    .optional(),
  potEnabled: z.boolean().optional(),
  potAmount: z.number()
    .min(0.01, "Pot amount must be at least $0.01")
    .max(10000, "Pot amount cannot exceed $10,000")
    .optional(),
  potDeadline: z.string()
    .datetime("Must be a valid datetime")
    .optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member']).describe("Role must be either 'admin' or 'member'"),
});

export const createJoinRequestSchema = z.object({
  joinCode: z.string()
    .min(6, "Join code must be at least 6 characters")
    .max(12, "Join code must be at most 12 characters")
    .regex(/^[A-Z0-9]+$/, "Join code can only contain uppercase letters and numbers"),
  message: z.string()
    .max(500, "Message must be 500 characters or less")
    .optional(),
});

export const respondToJoinRequestSchema = z.object({
  action: z.enum(['approve', 'reject']).describe("Action must be either 'approve' or 'reject'"),
});

export const squadSchemas = {
  createSquadSchema,
  joinSquadSchema,
  updateSquadSchema,
  updateMemberRoleSchema,
  createJoinRequestSchema,
  respondToJoinRequestSchema,
};

export type CreateSquadSchema = typeof createSquadSchema;
export type JoinSquadSchema = typeof joinSquadSchema;
export type UpdateSquadSchema = typeof updateSquadSchema;
export type UpdateMemberRoleSchema = typeof updateMemberRoleSchema;
export type CreateJoinRequestSchema = typeof createJoinRequestSchema;
export type RespondToJoinRequestSchema = typeof respondToJoinRequestSchema;