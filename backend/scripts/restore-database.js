// scripts/restore-database.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);

// Parse DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found');
  process.exit(1);
}

// Parse connection details from URL
const dbUrl = new URL(DATABASE_URL);
const dbConfig = {
  host: dbUrl.hostname,
  port: dbUrl.port || 5432,
  database: dbUrl.pathname.substring(1),
  username: dbUrl.username,
  password: dbUrl.password
};

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function listBackupFiles() {
  const backupDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(backupDir)) {
    console.log('📁 No backup directory found');
    return [];
  }

  return fs.readdirSync(backupDir)
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
}

async function restoreDatabase(backupFile, options = {}) {
  const {
    dropExisting = false,
    dataOnly = false,
    schemaOnly = false,
    verbose = false
  } = options;

  console.log('🏈 SquadPot Database Restore Tool');
  console.log('=================================');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🗄️  Database: ${dbConfig.database}@${dbConfig.host}`);
  console.log(`💾 Restore file: ${backupFile}`);
  console.log(`⚙️  Options: drop=${dropExisting}, dataOnly=${dataOnly}, schemaOnly=${schemaOnly}`);
  console.log('');

  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  try {
    // Set password via environment variable
    process.env.PGPASSWORD = dbConfig.password;

    if (dropExisting && !dataOnly) {
      console.log('⚠️  DANGER: This will drop and recreate all database objects!');
      const confirm = await askQuestion('Type "CONFIRM" to proceed: ');

      if (confirm !== 'CONFIRM') {
        console.log('❌ Restore cancelled');
        return;
      }

      console.log('🗑️  Dropping existing database objects...');

      // Create a clean database by dropping and recreating it
      const dropCommand = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=postgres --no-password -c "DROP DATABASE IF EXISTS \\"${dbConfig.database}\\"; CREATE DATABASE \\"${dbConfig.database}\\";"`

      await execAsync(dropCommand);
      console.log('✅ Database recreated');
    }

    let psqlCommand = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --no-password`;

    // Add options
    if (verbose) psqlCommand += ' --echo-all';
    if (dataOnly) psqlCommand += ' --data-only';
    if (schemaOnly) psqlCommand += ' --schema-only';

    psqlCommand += ` --file="${backupFile}"`;

    console.log('⏳ Restoring database...');

    const { stdout, stderr } = await execAsync(psqlCommand);

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️  Restore warnings:', stderr);
    }

    console.log('✅ Database restored successfully!');

    if (verbose && stdout) {
      console.log('\n📋 Restore output:');
      console.log(stdout);
    }

    // Verify restore by checking some basic tables
    console.log('\n🔍 Verifying restore...');
    const verifyCommand = `psql --host=${dbConfig.host} --port=${dbConfig.port} --username=${dbConfig.username} --dbname=${dbConfig.database} --no-password -c "\\dt"`;

    const { stdout: tables } = await execAsync(verifyCommand);
    const tableCount = (tables.match(/\n/g) || []).length - 3; // Rough count

    console.log(`✅ Found ${tableCount} tables in restored database`);

  } catch (error) {
    console.error('❌ Restore failed:', error.message);

    // Specific error handling
    if (error.message.includes('psql: command not found')) {
      console.error('\n💡 Solution: Install PostgreSQL client tools:');
      console.error('   Windows: Download from https://www.postgresql.org/download/windows/');
      console.error('   Mac: brew install postgresql');
      console.error('   Ubuntu: sudo apt-get install postgresql-client');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Solution: Check your DATABASE_URL credentials');
    }

    throw error;
  }
}

async function interactiveRestore() {
  console.log('🏈 SquadPot Interactive Database Restore\n');

  const backups = await listBackupFiles();

  if (backups.length === 0) {
    console.log('❌ No backup files found. Create a backup first with: npm run db:backup');
    return;
  }

  console.log('📋 Available backups:');
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name} (${backup.size}) - ${backup.created}`);
  });

  const choice = await askQuestion('\nSelect backup number to restore: ');
  const backupIndex = parseInt(choice) - 1;

  if (backupIndex < 0 || backupIndex >= backups.length) {
    console.log('❌ Invalid selection');
    return;
  }

  const selectedBackup = backups[backupIndex];
  console.log(`\n📁 Selected: ${selectedBackup.name}`);

  const dropConfirm = await askQuestion('Drop existing database objects first? (y/N): ');
  const dropExisting = dropConfirm.toLowerCase() === 'y';

  const restoreType = await askQuestion('Restore type (full/data-only/schema-only): ');

  const options = {
    dropExisting,
    dataOnly: restoreType === 'data-only',
    schemaOnly: restoreType === 'schema-only',
    verbose: true
  };

  await restoreDatabase(selectedBackup.path, options);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const backupFile = args[1];

  try {
    if (command === 'interactive') {
      await interactiveRestore();
    } else if (command === 'file' && backupFile) {
      const options = {
        dropExisting: args.includes('--drop'),
        dataOnly: args.includes('--data-only'),
        schemaOnly: args.includes('--schema-only'),
        verbose: args.includes('--verbose')
      };
      await restoreDatabase(backupFile, options);
    } else {
      console.log('🏈 SquadPot Database Restore Tool\n');
      console.log('Usage:');
      console.log('  node scripts/restore-database.js interactive');
      console.log('  node scripts/restore-database.js file <backup-file> [options]');
      console.log('\nOptions:');
      console.log('  --drop         Drop existing database objects first');
      console.log('  --data-only    Restore data only (no schema)');
      console.log('  --schema-only  Restore schema only (no data)');
      console.log('  --verbose      Show detailed output');
      console.log('\nExamples:');
      console.log('  npm run db:restore                    # Interactive restore');
      console.log('  npm run db:restore-file backup.sql    # Restore specific file');
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { restoreDatabase, listBackupFiles };