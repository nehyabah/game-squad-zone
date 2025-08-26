import { z } from 'zod';

/**
 * Environment variable schema.
 */
export const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
