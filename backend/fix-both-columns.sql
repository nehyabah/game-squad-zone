ALTER TABLE "User" ALTER COLUMN "authProvider" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE TEXT;
ALTER TABLE "User" ALTER COLUMN "authProvider" SET DEFAULT 'okta';

ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE TEXT;
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'active';

UPDATE "User" SET "authProvider" = 'okta' WHERE "authProvider" IS NULL OR "authProvider" = '';
UPDATE "User" SET "status" = 'active' WHERE "status" IS NULL OR "status" = '';
