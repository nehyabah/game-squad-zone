-- Fix PickSet status field to accept all valid values
-- Check current constraint (if any)
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'PickSet'::regclass 
AND contype = 'c';

-- Remove any CHECK constraint on status field if it exists
ALTER TABLE "PickSet" 
DROP CONSTRAINT IF EXISTS "PickSet_status_check";

-- Ensure status column accepts text values
ALTER TABLE "PickSet" 
ALTER COLUMN status TYPE TEXT;

-- Add a CHECK constraint for valid status values (optional, but recommended)
ALTER TABLE "PickSet" 
ADD CONSTRAINT "PickSet_status_check" 
CHECK (status IN ('draft', 'submitted', 'locked'));

-- Verify existing data
SELECT DISTINCT status, COUNT(*) 
FROM "PickSet" 
GROUP BY status;