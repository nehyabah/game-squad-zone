/* eslint-env node */
import { envSchema, type Env } from './env';

/**
 * Parsed and validated environment variables.
 */
export const env: Env = envSchema.parse(process.env);
