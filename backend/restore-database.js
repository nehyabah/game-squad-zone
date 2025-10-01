// Database restore script
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreDatabase() {
  const backupFile = 'backup_2025-10-01T12-48-47.json';

  console.log(`🔄 Restoring database from ${backupFile}...`);

  try {
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    console.log('📊 Backup contains:');
    console.log(`   - ${backupData.users?.length || 0} users`);
    console.log(`   - ${backupData.games?.length || 0} games`);
    console.log(`   - ${backupData.gameLines?.length || 0} game lines`);
    console.log(`   - ${backupData.pickSets?.length || 0} pick sets`);
    console.log(`   - ${backupData.picks?.length || 0} picks`);
    console.log(`   - ${backupData.squads?.length || 0} squads`);
    console.log(`   - ${backupData.squadMembers?.length || 0} squad members`);

    // Restore games FIRST (referenced by picks)
    if (backupData.games && backupData.games.length > 0) {
      console.log('\n🔄 Restoring games...');
      for (const game of backupData.games) {
        await prisma.game.upsert({
          where: { id: game.id },
          update: game,
          create: game
        });
      }
      console.log(`✅ Restored ${backupData.games.length} games`);
    }

    // Skip game lines - they'll be recreated by game sync
    console.log('\n⏭️  Skipping game lines (will be recreated by game sync)');

    // Restore pick sets (parent records for picks)
    if (backupData.pickSets && backupData.pickSets.length > 0) {
      console.log('\n🔄 Restoring pick sets...');
      for (const pickSet of backupData.pickSets) {
        await prisma.pickSet.upsert({
          where: { id: pickSet.id },
          update: pickSet,
          create: pickSet
        });
      }
      console.log(`✅ Restored ${backupData.pickSets.length} pick sets`);
    }

    // Restore individual picks (requires games and pickSets to exist)
    if (backupData.picks && backupData.picks.length > 0) {
      console.log('\n🔄 Restoring picks...');
      for (const pick of backupData.picks) {
        await prisma.pick.upsert({
          where: { id: pick.id },
          update: pick,
          create: pick
        });
      }
      console.log(`✅ Restored ${backupData.picks.length} picks`);
    }

    console.log('\n✅ Database restore completed successfully!');

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
