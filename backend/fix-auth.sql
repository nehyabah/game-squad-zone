UPDATE "User" SET "authProvider" = 'okta' WHERE "authProvider" IS NULL OR "authProvider" = '';
