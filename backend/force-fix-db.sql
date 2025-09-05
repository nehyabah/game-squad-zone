-- FORCE FIX: Drop and recreate authProvider column with correct type

-- First, drop the column if it exists (it might be an ENUM)
ALTER TABLE "User" 
DROP COLUMN IF EXISTS "authProvider";

-- Now add it back as TEXT
ALTER TABLE "User" 
ADD COLUMN "authProvider" TEXT DEFAULT 'okta' NOT NULL;

-- Update all existing records
UPDATE "User" 
SET "authProvider" = 'okta' 
WHERE "authProvider" IS NULL OR "authProvider" = '';

-- Also ensure other fields exist and are correct type
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;

-- Verify the fix
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'authProvider';