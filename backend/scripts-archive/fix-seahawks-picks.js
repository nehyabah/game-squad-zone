const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSeahawksPicks() {
  console.log('🔍 Checking and fixing Seahawks picks - should be WIN...\n');

  try {
    // Find all Seahawks games
    const seahawksGames = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        OR: [
          { homeTeam: { contains: 'Seahawks' } },
          { awayTeam: { contains: 'Seahawks' } }
        ]
      },
      include: {
        picks: {
          include: {
            pickSet: {
              include: {
                user: { select: { username: true, email: true } }
              }
            }
          }
        }
      }
    });

    console.log('🏈 Found Seahawks games:');
    seahawksGames.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
      console.log(`   Picks: ${game.picks.length}`);
    });

    let totalFixed = 0;

    for (const game of seahawksGames) {
      if (game.picks.length === 0) continue;

      console.log(`\n🎯 Processing ${game.awayTeam} @ ${game.homeTeam}:`);

      // Determine if Seahawks are home or away
      const seahawksAreAway = game.awayTeam.includes('Seahawks');
      const correctChoice = seahawksAreAway ? 'away' : 'home';

      console.log(`   Seahawks are: ${seahawksAreAway ? 'away' : 'home'}`);
      console.log(`   Score: ${game.awayScore}-${game.homeScore} (Seahawks ${seahawksAreAway ? 'won' : 'won'})`);

      // Find and fix Seahawks picks
      const seahawksPicks = game.picks.filter(pick => pick.choice === correctChoice);
      const nonSeahawksPicks = game.picks.filter(pick => pick.choice !== correctChoice);

      console.log(`   Seahawks picks (should WIN): ${seahawksPicks.length}`);
      console.log(`   Opponent picks (should LOSE): ${nonSeahawksPicks.length}`);

      // Fix Seahawks picks to WIN
      if (seahawksPicks.length > 0) {
        const seahawksUpdate = await prisma.pick.updateMany({
          where: {
            gameId: game.id,
            choice: correctChoice
          },
          data: {
            result: 'won:10',
            status: 'won',
            payout: 10
          }
        });

        console.log(`   ✅ Fixed ${seahawksUpdate.count} Seahawks picks → WON`);
        totalFixed += seahawksUpdate.count;

        // Show which users picked Seahawks
        seahawksPicks.forEach(pick => {
          const user = pick.pickSet.user.username || pick.pickSet.user.email;
          console.log(`     - ${user}: Seahawks → WON`);
        });
      }

      // Fix opponent picks to LOSE
      if (nonSeahawksPicks.length > 0) {
        const opponentUpdate = await prisma.pick.updateMany({
          where: {
            gameId: game.id,
            choice: correctChoice === 'away' ? 'home' : 'away'
          },
          data: {
            result: 'lost:0',
            status: 'lost',
            payout: 0
          }
        });

        console.log(`   ✅ Fixed ${opponentUpdate.count} opponent picks → LOST`);
        totalFixed += opponentUpdate.count;
      }
    }

    console.log(`\n📊 Seahawks Fix Summary:`);
    console.log(`   Total picks updated: ${totalFixed}`);

    // Verify the fix
    console.log('\n🔍 Verification - checking all Seahawks picks:');
    for (const game of seahawksGames) {
      const updatedPicks = await prisma.pick.findMany({
        where: { gameId: game.id },
        include: {
          pickSet: {
            include: {
              user: { select: { username: true, email: true } }
            }
          }
        }
      });

      if (updatedPicks.length > 0) {
        console.log(`\n   ${game.awayTeam} @ ${game.homeTeam}:`);
        updatedPicks.forEach(pick => {
          const user = pick.pickSet.user.username || pick.pickSet.user.email;
          console.log(`     ${user}: ${pick.choice} → ${pick.status} (${pick.result})`);
        });
      }
    }

    console.log('\n✅ Seahawks picks correction complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSeahawksPicks();