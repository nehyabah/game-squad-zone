/**
 * Leaderboard recalculation script.
 * This script recalculates all scores from scratch, useful for fixing data inconsistencies
 */
import { PrismaClient } from '@prisma/client';
import { ScoringService } from '../src/modules/scoring/scoring.service';

const prisma = new PrismaClient();
const scoringService = new ScoringService(prisma);

async function recalc() {
  try {
    console.log('🔄 Starting complete score recalculation...');

    // Step 1: Reset all pick results
    console.log('📝 Resetting all pick results...');
    await prisma.pick.updateMany({
      data: {
        status: 'pending',
        result: null,
        payout: null
      }
    });

    // Step 2: Get all completed games
    const completedGames = await prisma.game.findMany({
      where: {
        completed: true,
        homeScore: { not: null },
        awayScore: { not: null }
      }
    });

    console.log(`🏈 Found ${completedGames.length} completed games to recalculate`);

    if (completedGames.length === 0) {
      console.log('ℹ️  No completed games found. Nothing to recalculate.');
      return;
    }

    // Step 3: Recalculate scores for all completed games
    let totalPicksProcessed = 0;
    for (const game of completedGames) {
      console.log(`⚽ Recalculating: ${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}`);
      
      const results = await scoringService.scoreGamePicks(game.id);
      totalPicksProcessed += results.length;
      
      if (results.length > 0) {
        console.log(`   Processed ${results.length} picks`);
      }
    }

    console.log(`\n✅ Recalculation complete!`);
    console.log(`📊 Total picks processed: ${totalPicksProcessed}`);

    // Step 4: Show updated stats
    const userStats = await prisma.$queryRaw`
      SELECT 
        u.username,
        u.displayName,
        COUNT(p.id) as totalPicks,
        COUNT(CASE WHEN p.status = 'won' THEN 1 END) as wins,
        COUNT(CASE WHEN p.status = 'lost' THEN 1 END) as losses,
        COUNT(CASE WHEN p.status = 'pushed' THEN 1 END) as pushes,
        SUM(CASE WHEN p.status = 'won' THEN 10 ELSE 0 END) as points
      FROM User u
      LEFT JOIN PickSet ps ON u.id = ps.userId
      LEFT JOIN Pick p ON ps.id = p.pickSetId
      GROUP BY u.id
      HAVING totalPicks > 0
      ORDER BY points DESC, wins DESC
    `;

    console.log('\n📈 Updated user statistics:');
    (userStats as any[]).forEach(stat => {
      const name = stat.displayName || stat.username;
      console.log(`   ${name}: ${stat.points} pts (${stat.wins}W-${stat.losses}L-${stat.pushes}P) from ${stat.totalPicks} picks`);
    });

  } catch (error) {
    console.error('❌ Error during recalculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalc();
