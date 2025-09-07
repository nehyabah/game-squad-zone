-- SINGLE MIGRATION SCRIPT TO ALIGN DATABASE WITH CURRENT PRISMA SCHEMA
-- Run this once on production database to ensure it matches schema.prisma

-- ============================================
-- 1. USER TABLE UPDATES
-- ============================================

-- Add authProvider column if it doesn't exist (schema default: "okta")
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authProvider" TEXT DEFAULT 'okta';

-- Update existing nulls to default values
UPDATE "User" SET "authProvider" = 'okta' WHERE "authProvider" IS NULL OR "authProvider" = '';

-- Set all users to emailVerified = true (schema default now true)
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;

-- Ensure all User columns are TEXT type (not enums)
ALTER TABLE "User" 
  ALTER COLUMN "status" TYPE TEXT USING status::TEXT,
  ALTER COLUMN "authProvider" TYPE TEXT USING "authProvider"::TEXT,
  ALTER COLUMN "walletCurrency" TYPE TEXT USING "walletCurrency"::TEXT;

-- Set defaults as per schema
ALTER TABLE "User" 
  ALTER COLUMN "status" SET DEFAULT 'active',
  ALTER COLUMN "authProvider" SET DEFAULT 'okta',
  ALTER COLUMN "walletCurrency" SET DEFAULT 'eur',
  ALTER COLUMN "emailVerified" SET DEFAULT true;

-- ============================================
-- 2. PICKSET TABLE UPDATES  
-- ============================================

-- Convert status to TEXT (schema: String @default("draft"))
ALTER TABLE "PickSet" 
  ALTER COLUMN "status" TYPE TEXT USING status::TEXT;

ALTER TABLE "PickSet" 
  ALTER COLUMN "status" SET DEFAULT 'draft';

-- Remove any CHECK constraints
ALTER TABLE "PickSet" 
  DROP CONSTRAINT IF EXISTS "PickSet_status_check";

-- ============================================
-- 3. PICK TABLE UPDATES
-- ============================================

-- Convert all columns to TEXT as per schema
ALTER TABLE "Pick" 
  ALTER COLUMN "choice" TYPE TEXT USING choice::TEXT,
  ALTER COLUMN "status" TYPE TEXT USING status::TEXT,
  ALTER COLUMN "result" TYPE TEXT USING result::TEXT,
  ALTER COLUMN "lineSource" TYPE TEXT USING "lineSource"::TEXT;

ALTER TABLE "Pick" 
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- ============================================
-- 4. SQUAD TABLE UPDATES
-- ============================================

ALTER TABLE "Squad" 
  ALTER COLUMN "potCurrency" TYPE TEXT USING "potCurrency"::TEXT;

ALTER TABLE "Squad" 
  ALTER COLUMN "potCurrency" SET DEFAULT 'eur';

-- ============================================
-- 5. SQUADMEMBER TABLE UPDATES
-- ============================================

-- Convert role to TEXT (schema: String @default("member"))
ALTER TABLE "SquadMember" 
  ALTER COLUMN "role" TYPE TEXT USING role::TEXT;

ALTER TABLE "SquadMember" 
  ALTER COLUMN "role" SET DEFAULT 'member';

-- ============================================
-- 6. SQUADPAYMENT TABLE UPDATES
-- ============================================

ALTER TABLE "SquadPayment" 
  ALTER COLUMN "currency" TYPE TEXT USING currency::TEXT,
  ALTER COLUMN "status" TYPE TEXT USING status::TEXT;

ALTER TABLE "SquadPayment" 
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- ============================================
-- 7. WALLETTRANSACTION TABLE UPDATES
-- ============================================

ALTER TABLE "WalletTransaction" 
  ALTER COLUMN "currency" TYPE TEXT USING currency::TEXT,
  ALTER COLUMN "type" TYPE TEXT USING type::TEXT,
  ALTER COLUMN "status" TYPE TEXT USING status::TEXT;

ALTER TABLE "WalletTransaction" 
  ALTER COLUMN "currency" SET DEFAULT 'eur',
  ALTER COLUMN "status" SET DEFAULT 'pending';

-- ============================================
-- 8. DROP ALL ENUM TYPES
-- ============================================

-- Drop all PostgreSQL enum types (we use strings now)
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "AuthProvider" CASCADE;
DROP TYPE IF EXISTS "PickSetStatus" CASCADE;
DROP TYPE IF EXISTS "PickChoice" CASCADE;
DROP TYPE IF EXISTS "PickStatus" CASCADE;
DROP TYPE IF EXISTS "SquadRole" CASCADE;
DROP TYPE IF EXISTS "SquadRole_old" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "TransactionType" CASCADE;
DROP TYPE IF EXISTS "Currency" CASCADE;

-- ============================================
-- 9. VERIFICATION QUERY
-- ============================================

-- Run this to verify all changes were applied correctly
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.column_default
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND c.column_name IN ('status', 'role', 'choice', 'result', 'type', 'authProvider', 'currency', 'potCurrency', 'walletCurrency', 'lineSource', 'emailVerified')
ORDER BY t.table_name, c.column_name;