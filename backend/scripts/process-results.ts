/**
 * Game result processing script
 * This script processes completed games and calculates pick results
 */
import { PrismaClient } from '@prisma/client';
import { ScoringService } from '../src/modules/scoring/scoring.service';

const prisma = new PrismaClient();
const scoringService = new ScoringService(prisma);

async function processGameResults() {
  try {
    console.log('🎯 Starting game result processing...');

    // Get all games that are completed but haven't been processed
    const completedGames = await prisma.game.findMany({
      where: {
        completed: true,
        homeScore: { not: null },
        awayScore: { not: null }
      },
      include: {
        picks: {
          include: {
            pickSet: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${completedGames.length} completed games to process`);

    if (completedGames.length === 0) {
      console.log('ℹ️  No completed games found. You can simulate by updating game scores:');
      console.log('   1. Open Prisma Studio: npx prisma studio');
      console.log('   2. Go to Game table');
      console.log('   3. Set homeScore, awayScore, and completed=true for some games');
      console.log('   4. Run this script again');
      return;
    }

    let totalPicksProcessed = 0;
    let totalUsersAffected = 0;
    const affectedUsers = new Set<string>();

    // Process each game
    for (const game of completedGames) {
      console.log(`\n🏈 Processing game: ${game.homeTeam} vs ${game.awayTeam}`);
      console.log(`   Score: ${game.homeScore} - ${game.awayScore}`);
      console.log(`   Picks to process: ${game.picks.length}`);

      if (game.picks.length === 0) {
        console.log('   ⚠️  No picks found for this game');
        continue;
      }

      // Score all picks for this game
      const results = await scoringService.scoreGamePicks(game.id);
      
      for (const result of results) {
        const pick = game.picks.find(p => p.id === result.pickId);
        if (pick) {
          const user = pick.pickSet.user;
          console.log(`   ${user.username}: ${pick.choice} → ${result.status} (${result.points} points)`);
          affectedUsers.add(user.id);
          totalPicksProcessed++;
        }
      }
    }

    totalUsersAffected = affectedUsers.size;

    console.log('\n✅ Processing complete!');
    console.log(`📈 Results:`);
    console.log(`   • Games processed: ${completedGames.length}`);
    console.log(`   • Picks processed: ${totalPicksProcessed}`);
    console.log(`   • Users affected: ${totalUsersAffected}`);

    // Show updated leaderboard
    console.log('\n🏆 Updated leaderboard (top 5):');
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        u.username,
        u.displayName,
        COUNT(CASE WHEN p.status = 'won' THEN 1 END) as wins,
        COUNT(CASE WHEN p.status = 'lost' THEN 1 END) as losses,
        COUNT(CASE WHEN p.status = 'pushed' THEN 1 END) as pushes,
        SUM(CASE WHEN p.status = 'won' THEN 10 ELSE 0 END) as points
      FROM User u
      LEFT JOIN PickSet ps ON u.id = ps.userId
      LEFT JOIN Pick p ON ps.id = p.pickSetId
      WHERE p.status IS NOT NULL
      GROUP BY u.id
      HAVING points > 0
      ORDER BY points DESC, wins DESC
      LIMIT 5
    `;

    (leaderboard as any[]).forEach((entry, index) => {
      const name = entry.displayName || entry.username;
      console.log(`   ${index + 1}. ${name}: ${entry.points} points (${entry.wins}W-${entry.losses}L-${entry.pushes}P)`);
    });

  } catch (error) {
    console.error('❌ Error processing game results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
processGameResults();