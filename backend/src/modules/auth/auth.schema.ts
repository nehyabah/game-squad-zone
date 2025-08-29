// src/modules/auth/auth.schema.ts
import { z } from "zod";
import { Type } from "@sinclair/typebox";

// Request schemas (Zod)
export const OktaExchangeBody = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const RefreshTokenBody = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// Response schemas (Typebox for Fastify)
export const TokenResponseSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
  refreshExpiresAt: Type.String(), // ISO date string
});

export const RefreshResponseSchema = Type.Object({
  accessToken: Type.String(),
});

// TypeScript types
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

// Type exports for Zod schemas
export type OktaExchangeInput = z.infer<typeof OktaExchangeBody>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenBody>;
