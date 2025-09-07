-- COMPREHENSIVE FIX FOR ALL ENUM ISSUES IN PRODUCTION DATABASE
-- This script converts all enum columns to TEXT to match Prisma's expectations

-- 1. Fix User table
ALTER TABLE "User" 
  ALTER COLUMN "status" TYPE TEXT,
  ALTER COLUMN "authProvider" TYPE TEXT,
  ALTER COLUMN "walletCurrency" TYPE TEXT;

-- Set defaults if they don't exist
ALTER TABLE "User" 
  ALTER COLUMN "status" SET DEFAULT 'active',
  ALTER COLUMN "authProvider" SET DEFAULT 'okta',
  ALTER COLUMN "walletCurrency" SET DEFAULT 'eur';

-- 2. Fix PickSet table
ALTER TABLE "PickSet" 
  ALTER COLUMN "status" TYPE TEXT;

ALTER TABLE "PickSet" 
  ALTER COLUMN "status" SET DEFAULT 'draft';

-- 3. Fix Pick table  
ALTER TABLE "Pick" 
  ALTER COLUMN "choice" TYPE TEXT,
  ALTER COLUMN "status" TYPE TEXT,
  ALTER COLUMN "result" TYPE TEXT,
  ALTER COLUMN "lineSource" TYPE TEXT;

ALTER TABLE "Pick" 
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- 4. Fix Squad table
ALTER TABLE "Squad" 
  ALTER COLUMN "potCurrency" TYPE TEXT;

ALTER TABLE "Squad" 
  ALTER COLUMN "potCurrency" SET DEFAULT 'eur';

-- 5. Fix SquadMember table
ALTER TABLE "SquadMember" 
  ALTER COLUMN "role" TYPE TEXT;

ALTER TABLE "SquadMember" 
  ALTER COLUMN "role" SET DEFAULT 'member';

-- 6. Fix SquadPayment table
ALTER TABLE "SquadPayment" 
  ALTER COLUMN "currency" TYPE TEXT,
  ALTER COLUMN "status" TYPE TEXT;

ALTER TABLE "SquadPayment" 
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- 7. Fix WalletTransaction table
ALTER TABLE "WalletTransaction" 
  ALTER COLUMN "currency" TYPE TEXT,
  ALTER COLUMN "type" TYPE TEXT,
  ALTER COLUMN "status" TYPE TEXT;

ALTER TABLE "WalletTransaction" 
  ALTER COLUMN "currency" SET DEFAULT 'eur',
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- 8. Drop any existing enum types (if they exist)
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "AuthProvider" CASCADE;
DROP TYPE IF EXISTS "PickSetStatus" CASCADE;
DROP TYPE IF EXISTS "PickChoice" CASCADE;
DROP TYPE IF EXISTS "PickStatus" CASCADE;
DROP TYPE IF EXISTS "SquadRole" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "Currency" CASCADE;

-- 9. Optional: Add CHECK constraints for validation
-- Only add these if you want strict validation

-- User status validation
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_status_check";
ALTER TABLE "User" ADD CONSTRAINT "User_status_check" 
  CHECK (status IN ('active', 'suspended', 'deleted'));

-- PickSet status validation
ALTER TABLE "PickSet" DROP CONSTRAINT IF EXISTS "PickSet_status_check";
ALTER TABLE "PickSet" ADD CONSTRAINT "PickSet_status_check" 
  CHECK (status IN ('draft', 'submitted', 'locked'));

-- Pick choice validation
ALTER TABLE "Pick" DROP CONSTRAINT IF EXISTS "Pick_choice_check";
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_choice_check" 
  CHECK (choice IN ('home', 'away'));

-- Pick status validation
ALTER TABLE "Pick" DROP CONSTRAINT IF EXISTS "Pick_status_check";
ALTER TABLE "Pick" ADD CONSTRAINT "Pick_status_check" 
  CHECK (status IN ('pending', 'won', 'lost', 'pushed'));

-- SquadMember role validation
ALTER TABLE "SquadMember" DROP CONSTRAINT IF EXISTS "SquadMember_role_check";
ALTER TABLE "SquadMember" ADD CONSTRAINT "SquadMember_role_check" 
  CHECK (role IN ('owner', 'admin', 'member', 'OWNER', 'MODERATOR', 'MEMBER'));

-- SquadPayment status validation
ALTER TABLE "SquadPayment" DROP CONSTRAINT IF EXISTS "SquadPayment_status_check";
ALTER TABLE "SquadPayment" ADD CONSTRAINT "SquadPayment_status_check" 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- WalletTransaction status validation
ALTER TABLE "WalletTransaction" DROP CONSTRAINT IF EXISTS "WalletTransaction_status_check";
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_status_check" 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- 10. Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name IN ('status', 'role', 'choice', 'result', 'type', 'authProvider', 'currency', 'potCurrency', 'walletCurrency', 'lineSource')
ORDER BY table_name, column_name;