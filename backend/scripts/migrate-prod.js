// Production database migration script
const { PrismaClient } = require('@prisma/client');

async function migrate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Running database migrations...');
    
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Run migrations
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('✅ Migrations completed successfully');
    
    // Generate Prisma client
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();