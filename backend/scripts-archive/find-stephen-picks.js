const { PrismaClient } = require('@prisma/client');

async function findStephenLennonPicks() {
  const prisma = new PrismaClient();

  try {
    const stephenId = 'user_1d6ac3b6ce8b8939';

    console.log('🔍 Deep search for Stephen Lennon picks...');
    console.log('User ID:', stephenId);

    // Check all his pick sets across all weeks
    const allPickSets = await prisma.pickSet.findMany({
      where: { userId: stephenId },
      include: {
        picks: {
          include: {
            game: {
              select: {
                weekId: true,
                homeTeam: true,
                awayTeam: true,
                homeScore: true,
                awayScore: true,
                completed: true
              }
            }
          }
        }
      },
      orderBy: { weekId: 'asc' }
    });

    console.log(`📊 Found ${allPickSets.length} pick sets total:`);

    allPickSets.forEach(pickSet => {
      console.log(`\n📅 ${pickSet.weekId}:`);
      console.log(`  Status: ${pickSet.status}`);
      console.log(`  Picks: ${pickSet.picks.length}`);

      if (pickSet.picks.length > 0) {
        pickSet.picks.forEach(pick => {
          const game = pick.game;
          const teamPicked = pick.choice === 'home' ? game.homeTeam : game.awayTeam;
          const result = pick.result || 'pending';

          console.log(`    - Picked: ${teamPicked} (${pick.choice})`);
          console.log(`      Game: ${game.awayTeam} @ ${game.homeTeam}`);
          console.log(`      Result: ${pick.status} (${result})`);

          // Check for Bengals, Cardinals, Eagles
          if (teamPicked.includes('Bengal') || teamPicked.includes('Cardinal') || teamPicked.includes('Eagle')) {
            console.log(`      *** MATCH: This is one of the expected picks! ***`);
          }
        });
      }
    });

    // Search specifically for Week 2 games involving Bengals, Cardinals, Eagles
    console.log('\n🎯 Searching Week 2 games with Bengals, Cardinals, Eagles:');

    const week2Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W2',
        OR: [
          { homeTeam: { contains: 'Bengal' } },
          { awayTeam: { contains: 'Bengal' } },
          { homeTeam: { contains: 'Cardinal' } },
          { awayTeam: { contains: 'Cardinal' } },
          { homeTeam: { contains: 'Eagle' } },
          { awayTeam: { contains: 'Eagle' } }
        ]
      },
      select: {
        id: true,
        homeTeam: true,
        awayTeam: true,
        homeScore: true,
        awayScore: true,
        completed: true,
        picks: {
          where: {
            pickSet: {
              userId: stephenId
            }
          }
        }
      }
    });

    console.log(`Found ${week2Games.length} relevant Week 2 games:`);
    week2Games.forEach(game => {
      const gameResult = game.completed ? `${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam}` : 'Not played';
      console.log(`  - ${game.awayTeam} @ ${game.homeTeam}: ${gameResult}`);
      console.log(`    Stephen's picks on this game: ${game.picks.length}`);

      game.picks.forEach(pick => {
        const teamPicked = pick.choice === 'home' ? game.homeTeam : game.awayTeam;
        console.log(`      Picked: ${teamPicked} (${pick.status}: ${pick.result})`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findStephenLennonPicks();