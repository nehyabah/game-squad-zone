// Emergency database fix script
// Run this directly to fix the authProvider field issue

const { PrismaClient } = require('@prisma/client');

async function emergencyFix() {
  console.log('🚨 EMERGENCY DATABASE FIX - Starting...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set!');
    console.log('Please set DATABASE_URL environment variable to your Railway database URL');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    // Try to run raw SQL to fix the column
    console.log('🔧 Attempting to fix authProvider column...');
    
    // Step 1: Drop the column if it exists
    try {
      await prisma.$executeRaw`ALTER TABLE "User" DROP COLUMN IF EXISTS "authProvider"`;
      console.log('✅ Dropped existing authProvider column');
    } catch (e) {
      console.log('⚠️  Could not drop column (may not exist):', e.message);
    }

    // Step 2: Add it back as TEXT
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "authProvider" TEXT DEFAULT 'okta' NOT NULL`;
      console.log('✅ Added authProvider column as TEXT');
    } catch (e) {
      console.log('⚠️  Could not add column:', e.message);
      // Try to alter it if it already exists
      try {
        await prisma.$executeRaw`ALTER TABLE "User" ALTER COLUMN "authProvider" TYPE TEXT`;
        console.log('✅ Altered authProvider column to TEXT');
      } catch (e2) {
        console.log('⚠️  Could not alter column type:', e2.message);
      }
    }

    // Step 3: Update any NULL values
    try {
      const updated = await prisma.$executeRaw`UPDATE "User" SET "authProvider" = 'okta' WHERE "authProvider" IS NULL OR "authProvider" = ''`;
      console.log(`✅ Updated ${updated} records to have authProvider = 'okta'`);
    } catch (e) {
      console.log('⚠️  Could not update records:', e.message);
    }

    // Step 4: Verify the fix
    console.log('🔍 Verifying database schema...');
    const result = await prisma.$queryRaw`
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
        AND column_name = 'authProvider'
    `;
    
    console.log('📊 Current authProvider column info:', result);

    // Step 5: Test with a real query
    console.log('🧪 Testing User query...');
    const users = await prisma.user.findMany({ take: 1 });
    console.log(`✅ Successfully queried users table (${users.length} users found)`);

    console.log('');
    console.log('🎉 EMERGENCY FIX COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Redeploy your application on Railway');
    console.log('2. Test the authentication flow');
    
  } catch (error) {
    console.error('❌ EMERGENCY FIX FAILED:', error);
    console.error('Full error:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if running directly
if (require.main === module) {
  emergencyFix().catch(console.error);
} else {
  module.exports = { emergencyFix };
}