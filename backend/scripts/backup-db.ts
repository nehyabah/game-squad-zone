import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backupDatabase(backupName: string) {
  console.log(`🔄 Starting database backup: ${backupName}`);

  try {
    const backup: any = {
      timestamp: new Date().toISOString(),
      backupName,
      data: {}
    };

    // Backup all tables
    console.log('📦 Backing up Users...');
    backup.data.users = await prisma.user.findMany();

    console.log('📦 Backing up Sessions...');
    backup.data.sessions = await prisma.session.findMany();

    console.log('📦 Backing up Games...');
    backup.data.games = await prisma.game.findMany();

    console.log('📦 Backing up GameLines...');
    backup.data.gameLines = await prisma.gameLine.findMany();

    console.log('📦 Backing up PickSets...');
    backup.data.pickSets = await prisma.pickSet.findMany();

    console.log('📦 Backing up Picks...');
    backup.data.picks = await prisma.pick.findMany();

    console.log('📦 Backing up Squads...');
    backup.data.squads = await prisma.squad.findMany();

    console.log('📦 Backing up SquadMembers...');
    backup.data.squadMembers = await prisma.squadMember.findMany();

    console.log('📦 Backing up SquadMessages...');
    backup.data.squadMessages = await prisma.squadMessage.findMany();

    console.log('📦 Backing up SquadPayments...');
    backup.data.squadPayments = await prisma.squadPayment.findMany();

    console.log('📦 Backing up SquadJoinRequests...');
    backup.data.squadJoinRequests = await prisma.squadJoinRequest.findMany();

    console.log('📦 Backing up WalletTransactions...');
    backup.data.walletTransactions = await prisma.walletTransaction.findMany();

    console.log('📦 Backing up PushSubscriptions...');
    backup.data.pushSubscriptions = await prisma.pushSubscription.findMany();

    console.log('📦 Backing up NotificationLogs...');
    backup.data.notificationLogs = await prisma.notificationLog.findMany();

    console.log('📦 Backing up Six Nations data...');
    backup.data.sixNationsRounds = await prisma.sixNationsRound.findMany();
    backup.data.sixNationsMatches = await prisma.sixNationsMatch.findMany();
    backup.data.sixNationsQuestions = await prisma.sixNationsQuestion.findMany();
    backup.data.sixNationsAnswers = await prisma.sixNationsAnswer.findMany();

    // Calculate stats
    const stats = {
      users: backup.data.users.length,
      games: backup.data.games.length,
      pickSets: backup.data.pickSets.length,
      picks: backup.data.picks.length,
      squads: backup.data.squads.length,
      squadMembers: backup.data.squadMembers.length,
    };

    console.log('\n📊 Backup Statistics:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Games: ${stats.games}`);
    console.log(`   PickSets: ${stats.pickSets}`);
    console.log(`   Picks: ${stats.picks}`);
    console.log(`   Squads: ${stats.squads}`);
    console.log(`   Squad Members: ${stats.squadMembers}`);

    // Save to file
    const fileName = `${backupName.replace(/\//g, '-')}.json`;
    const filePath = path.join(__dirname, '..', fileName);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

    console.log(`\n✅ Backup saved to: ${filePath}`);
    console.log(`📦 Total size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get backup name from command line or use default
const backupName = process.argv[2] || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;

backupDatabase(backupName);
