-- Fix database schema for Railway production
-- Add missing authProvider field and fix other issues

-- Add authProvider column if it doesn't exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "authProvider" TEXT DEFAULT 'okta';

-- Update any NULL values to 'okta'
UPDATE "User" 
SET "authProvider" = 'okta' 
WHERE "authProvider" IS NULL;

-- Make sure all required fields exist
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;

-- Clean up old enum types (if they exist)
DO $$ 
BEGIN
    -- Check if the old enum exists and drop it
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SquadRole_old') THEN
        -- First, change any columns using it
        ALTER TABLE "SquadMember" 
        ALTER COLUMN "role" TYPE TEXT;
        
        -- Now drop the old enum
        DROP TYPE IF EXISTS "SquadRole_old" CASCADE;
    END IF;
END $$;

-- Ensure SquadMember role column is TEXT
ALTER TABLE "SquadMember" 
ALTER COLUMN "role" TYPE TEXT;

-- Set default values for role
UPDATE "SquadMember" 
SET "role" = 'member' 
WHERE "role" IS NULL OR "role" = '';

-- Add any missing indexes
CREATE INDEX IF NOT EXISTS "User_oktaId_idx" ON "User"("oktaId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'User' 
    AND column_name IN ('authProvider', 'displayName', 'phoneNumber')
ORDER BY 
    ordinal_position;