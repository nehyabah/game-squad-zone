UPDATE "User" SET "authProvider" = 'okta' WHERE "authProvider" IS NULL OR "authProvider" = '';
ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE text USING "authProvider"::text;
ALTER TABLE "User" ALTER COLUMN "authProvider" SET DEFAULT 'okta';
