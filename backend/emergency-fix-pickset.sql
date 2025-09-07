-- EMERGENCY FIX - Just fix PickSet status to unblock the app
-- Run this immediately to fix the 500 error

-- Remove any enum type or constraint on PickSet.status
ALTER TABLE "PickSet" 
  ALTER COLUMN "status" TYPE TEXT USING status::TEXT;

-- Ensure default is set
ALTER TABLE "PickSet" 
  ALTER COLUMN "status" SET DEFAULT 'draft';

-- Remove any CHECK constraints
ALTER TABLE "PickSet" 
  DROP CONSTRAINT IF EXISTS "PickSet_status_check";

-- Verify it worked
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'PickSet' AND column_name = 'status';