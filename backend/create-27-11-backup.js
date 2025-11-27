const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function create27_11Backup() {
  try {
    console.log('=== CREATING 27/11 DATABASE BACKUP ===\n');

    const backupFilename = `backup-27-11-2025.json`;

    // Backup all tables
    console.log('Backing up all database tables...\n');

    console.log('1. Users...');
    const users = await prisma.user.findMany();
    console.log(`   ✅ ${users.length} users`);

    console.log('2. Sessions...');
    const sessions = await prisma.session.findMany();
    console.log(`   ✅ ${sessions.length} sessions`);

    console.log('3. Games...');
    const games = await prisma.game.findMany({
      include: {
        lines: true
      }
    });
    console.log(`   ✅ ${games.length} games`);

    console.log('4. Game Lines...');
    const gameLines = await prisma.gameLine.findMany();
    console.log(`   ✅ ${gameLines.length} game lines`);

    console.log('5. Pick Sets...');
    const pickSets = await prisma.pickSet.findMany();
    console.log(`   ✅ ${pickSets.length} pick sets`);

    console.log('6. Picks...');
    const picks = await prisma.pick.findMany();
    console.log(`   ✅ ${picks.length} picks`);

    console.log('7. Squads...');
    const squads = await prisma.squad.findMany();
    console.log(`   ✅ ${squads.length} squads`);

    console.log('8. Squad Members...');
    const squadMembers = await prisma.squadMember.findMany();
    console.log(`   ✅ ${squadMembers.length} squad members`);

    console.log('9. Squad Messages...');
    const squadMessages = await prisma.squadMessage.findMany();
    console.log(`   ✅ ${squadMessages.length} squad messages`);

    console.log('10. Squad Payments...');
    const squadPayments = await prisma.squadPayment.findMany();
    console.log(`   ✅ ${squadPayments.length} squad payments`);

    console.log('11. Squad Join Requests...');
    const squadJoinRequests = await prisma.squadJoinRequest.findMany();
    console.log(`   ✅ ${squadJoinRequests.length} join requests`);

    console.log('12. Wallet Transactions...');
    const walletTransactions = await prisma.walletTransaction.findMany();
    console.log(`   ✅ ${walletTransactions.length} wallet transactions`);

    console.log('13. Push Subscriptions...');
    const pushSubscriptions = await prisma.pushSubscription.findMany();
    console.log(`   ✅ ${pushSubscriptions.length} push subscriptions`);

    console.log('14. Notification Logs...');
    const notificationLogs = await prisma.notificationLog.findMany();
    console.log(`   ✅ ${notificationLogs.length} notification logs`);

    // Calculate statistics
    const stats = {
      users: users.length,
      sessions: sessions.length,
      games: games.length,
      gameLines: gameLines.length,
      pickSets: pickSets.length,
      picks: picks.length,
      squads: squads.length,
      squadMembers: squadMembers.length,
      squadMessages: squadMessages.length,
      squadPayments: squadPayments.length,
      squadJoinRequests: squadJoinRequests.length,
      walletTransactions: walletTransactions.length,
      pushSubscriptions: pushSubscriptions.length,
      notificationLogs: notificationLogs.length
    };

    // Game statistics by week
    const gamesByWeek = games.reduce((acc, game) => {
      if (!acc[game.weekId]) {
        acc[game.weekId] = {
          total: 0,
          completed: 0,
          withScores: 0
        };
      }
      acc[game.weekId].total++;
      if (game.completed) acc[game.weekId].completed++;
      if (game.homeScore !== null || game.awayScore !== null) acc[game.weekId].withScores++;
      return acc;
    }, {});

    // Pick statistics by week
    const picksByWeek = pickSets.reduce((acc, ps) => {
      if (!acc[ps.weekId]) {
        acc[ps.weekId] = {
          pickSets: 0,
          totalPicks: 0
        };
      }
      acc[ps.weekId].pickSets++;
      return acc;
    }, {});

    picks.forEach(pick => {
      const pickSet = pickSets.find(ps => ps.id === pick.pickSetId);
      if (pickSet && picksByWeek[pickSet.weekId]) {
        picksByWeek[pickSet.weekId].totalPicks++;
      }
    });

    // Create backup object
    const backup = {
      metadata: {
        backupDate: new Date('2025-11-27').toISOString(),
        backupName: '27/11 Backup - Before Six Nations Implementation',
        createdAt: new Date().toISOString(),
        databaseVersion: 'v1.0',
        totalRecords: Object.values(stats).reduce((sum, val) => sum + val, 0),
        statistics: stats,
        gamesByWeek: gamesByWeek,
        picksByWeek: picksByWeek,
        notes: [
          'Backup created before Six Nations implementation',
          'Includes Thursday/Friday game filter changes',
          'All user data, picks, squads, and games preserved'
        ]
      },
      data: {
        users: users,
        sessions: sessions,
        games: games,
        gameLines: gameLines,
        pickSets: pickSets,
        picks: picks,
        squads: squads,
        squadMembers: squadMembers,
        squadMessages: squadMessages,
        squadPayments: squadPayments,
        squadJoinRequests: squadJoinRequests,
        walletTransactions: walletTransactions,
        pushSubscriptions: pushSubscriptions,
        notificationLogs: notificationLogs
      }
    };

    // Write backup file
    const backupPath = path.join(__dirname, backupFilename);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    // Get file size
    const stats_file = fs.statSync(backupPath);
    const fileSizeInMB = (stats_file.size / (1024 * 1024)).toFixed(2);

    console.log('\n=== 27/11 BACKUP SUMMARY ===');
    console.log(`Backup Name: 27/11 Backup - Before Six Nations Implementation`);
    console.log(`Backup Date: 2025-11-27`);
    console.log(`Created At: ${backup.metadata.createdAt}`);
    console.log(`Total Records: ${backup.metadata.totalRecords.toLocaleString()}`);
    console.log(`File Size: ${fileSizeInMB} MB`);

    console.log('\n--- Table Counts ---');
    Object.entries(stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count.toLocaleString()}`);
    });

    console.log('\n--- Games by Week ---');
    Object.keys(gamesByWeek).sort().forEach(weekId => {
      const data = gamesByWeek[weekId];
      console.log(`  ${weekId}: ${data.total} games (${data.completed} completed, ${data.withScores} with scores)`);
    });

    console.log('\n--- Picks by Week ---');
    Object.keys(picksByWeek).sort().forEach(weekId => {
      const data = picksByWeek[weekId];
      console.log(`  ${weekId}: ${data.pickSets} pick sets, ${data.totalPicks} total picks`);
    });

    console.log(`\n✅ 27/11 BACKUP COMPLETE`);
    console.log(`   File: ${backupFilename}`);
    console.log(`   Path: ${backupPath}`);
    console.log(`   Size: ${fileSizeInMB} MB`);
    console.log('\n📝 Notes:');
    backup.metadata.notes.forEach(note => {
      console.log(`   - ${note}`);
    });

  } catch (error) {
    console.error('❌ BACKUP FAILED:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

create27_11Backup();
