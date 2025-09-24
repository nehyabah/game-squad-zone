// scripts/backup-database.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Parse DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found');
  process.exit(1);
}

// Parse connection details from URL
// postgresql://bycocjkgpo:Hsa17tyu@squadpot-public-db.postgres.database.azure.com:5432/postgres
const dbUrl = new URL(DATABASE_URL);
const dbConfig = {
  host: dbUrl.hostname,
  port: dbUrl.port || 5432,
  database: dbUrl.pathname.substring(1), // Remove leading /
  username: dbUrl.username,
  password: dbUrl.password
};

async function createBackup(type = 'full') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

  console.log('🏈 SquadPot Database Backup Tool');
  console.log('================================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🗄️  Database: ${dbConfig.database}@${dbConfig.host}`);
  console.log(`💾 Backup file: ${backupFile}`);
  console.log('');

  try {
    let pgDumpCommand;

    if (type === 'schema-only') {
      // Schema only backup (structure without data)
      pgDumpCommand = `pg_dump --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --schema-only --no-password --file="${backupFile}"`;
    } else if (type === 'data-only') {
      // Data only backup (no schema)
      pgDumpCommand = `pg_dump --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --data-only --no-password --file="${backupFile}"`;
    } else {
      // Full backup (schema + data) - DEFAULT
      pgDumpCommand = `pg_dump --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --no-password --file="${backupFile}"`;
    }

    // Set password via environment variable for pg_dump
    process.env.PGPASSWORD = dbConfig.password;

    console.log('⏳ Creating backup...');
    const { stdout, stderr } = await execAsync(pgDumpCommand);

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️  Backup warnings:', stderr);
    }

    // Verify backup file was created and has content
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('✅ Backup completed successfully!');
    console.log(`📊 Backup size: ${fileSizeMB} MB`);
    console.log(`📁 Location: ${backupFile}`);

    // Show a preview of what's in the backup
    console.log('\n📋 Backup contents preview:');
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    const lines = backupContent.split('\n').slice(0, 20);
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('--')) {
        console.log(`   ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
      }
    });

    return backupFile;

  } catch (error) {
    console.error('❌ Backup failed:', error.message);

    // Specific error handling
    if (error.message.includes('pg_dump: command not found')) {
      console.error('\n💡 Solution: Install PostgreSQL client tools:');
      console.error('   Windows: Download from https://www.postgresql.org/download/windows/');
      console.error('   Mac: brew install postgresql');
      console.error('   Ubuntu: sudo apt-get install postgresql-client');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Solution: Check your DATABASE_URL credentials');
    } else if (error.message.includes('could not connect')) {
      console.error('\n💡 Solution: Check network connection and Azure firewall rules');
    }

    throw error;
  }
}

async function listBackups() {
  const backupDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(backupDir)) {
    console.log('📁 No backup directory found');
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.birthtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));

  console.log('\n📋 Available backups:');
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${file.name}`);
    console.log(`   📅 Created: ${file.created}`);
    console.log(`   📊 Size: ${file.size}`);
    console.log('');
  });

  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const type = args[1] || 'full';

  try {
    if (command === 'create') {
      await createBackup(type);
    } else if (command === 'list') {
      await listBackups();
    } else {
      console.log('🏈 SquadPot Database Backup Tool\n');
      console.log('Usage:');
      console.log('  node scripts/backup-database.js create [full|schema-only|data-only]');
      console.log('  node scripts/backup-database.js list');
      console.log('\nExamples:');
      console.log('  npm run db:backup              # Create full backup');
      console.log('  npm run db:backup schema-only  # Backup schema only');
      console.log('  npm run db:backup data-only    # Backup data only');
      console.log('  npm run db:backup-list          # List all backups');
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createBackup, listBackups };