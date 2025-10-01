// Auto-backup script that runs before server starts
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupFile = path.join(__dirname, `auto-backup_${timestamp}.json`);

  try {
    console.log('📦 Creating automatic backup before server start...');

    const backup = {
      timestamp,
      users: await prisma.user.findMany(),
      games: await prisma.game.findMany(),
      pickSets: await prisma.pickSet.findMany(),
      picks: await prisma.pick.findMany(),
      squads: await prisma.squad.findMany(),
      squadMembers: await prisma.squadMember.findMany(),
    };

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Auto-backup created: ${backupFile}`);
    console.log(`   - ${backup.pickSets.length} pick sets`);
    console.log(`   - ${backup.picks.length} picks`);

    // Keep only last 5 backups
    const backups = fs.readdirSync(__dirname)
      .filter(f => f.startsWith('auto-backup_'))
      .sort()
      .reverse();

    backups.slice(5).forEach(old => {
      fs.unlinkSync(path.join(__dirname, old));
      console.log(`🗑️  Deleted old backup: ${old}`);
    });

  } catch (error) {
    console.error('❌ Auto-backup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createBackup();
