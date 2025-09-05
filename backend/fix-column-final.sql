ALTER TABLE "User" ALTER COLUMN "authProvider" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE TEXT;
ALTER TABLE "User" ALTER COLUMN "authProvider" SET DEFAULT 'okta';
UPDATE "User" SET "authProvider" = 'okta' WHERE "authProvider" IS NULL OR "authProvider" = '';
