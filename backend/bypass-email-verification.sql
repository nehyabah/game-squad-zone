-- Set all users to emailVerified = true to bypass email verification
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;