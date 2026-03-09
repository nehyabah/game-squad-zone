const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEKPicks() {
  console.log('🔄 Fixing EK picks - clearing all and replacing with exactly 3...\n');

  try {
    // Find EK user by exact email
    const user = await prisma.user.findFirst({
      where: {
        email: 'eoin.kidd@lawlibrary.ie'
      }
    });

    if (!user) {
      console.log('❌ EK user (eoin.kidd@lawlibrary.ie) not found');
      return;
    }

    console.log(`👤 Found user: ${user.username || user.email} (ID: ${user.id})`);

    // Find EK's pick set
    const pickSet = await prisma.pickSet.findFirst({
      where: {
        userId: user.id,
        weekId: '2025-W3'
      },
      include: {
        picks: true
      }
    });

    if (!pickSet) {
      console.log('❌ No pick set found for EK');
      return;
    }

    console.log(`📋 Found pick set: ${pickSet.id} with ${pickSet.picks.length} picks`);

    // Clear all existing picks for EK
    console.log('🗑️  Deleting all existing picks...');
    const deletedCount = await prisma.pick.deleteMany({
      where: {
        pickSetId: pickSet.id
      }
    });

    console.log(`✅ Deleted ${deletedCount.count} existing picks`);

    // Find the games for Titans, Browns, Panthers
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        OR: [
          { homeTeam: { contains: 'Titans' } },
          { awayTeam: { contains: 'Titans' } },
          { homeTeam: { contains: 'Browns' } },
          { awayTeam: { contains: 'Browns' } },
          { homeTeam: { contains: 'Panthers' } },
          { awayTeam: { contains: 'Panthers' } }
        ]
      }
    });

    console.log('\n🏈 Found games for EK picks:');
    games.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

    // Create exactly 3 picks for EK:
    // Titans - LOSE (you said "titans losing")
    // Browns - WIN (Browns won vs Packers 13-10)
    // Panthers - WIN (Panthers won vs Falcons 30-0)

    const picksToAdd = [];

    // 1. Tennessee Titans game - LOSE
    const titansGame = games.find(g =>
      g.homeTeam.includes('Titans') || g.awayTeam.includes('Titans')
    );
    if (titansGame) {
      const titansChoice = titansGame.awayTeam.includes('Titans') ? 'away' : 'home';
      picksToAdd.push({
        game: titansGame,
        choice: titansChoice,
        result: 'lost:0',
        status: 'lost',
        payout: 0,
        team: 'Titans'
      });
    }

    // 2. Cleveland Browns game - WIN
    const brownsGame = games.find(g =>
      g.homeTeam.includes('Browns') || g.awayTeam.includes('Browns')
    );
    if (brownsGame) {
      const brownsChoice = brownsGame.awayTeam.includes('Browns') ? 'away' : 'home';
      picksToAdd.push({
        game: brownsGame,
        choice: brownsChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Browns'
      });
    }

    // 3. Carolina Panthers game - WIN
    const panthersGame = games.find(g =>
      g.homeTeam.includes('Panthers') || g.awayTeam.includes('Panthers')
    );
    if (panthersGame) {
      const panthersChoice = panthersGame.awayTeam.includes('Panthers') ? 'away' : 'home';
      picksToAdd.push({
        game: panthersGame,
        choice: panthersChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Panthers'
      });
    }

    console.log(`\n🎯 Creating exactly ${picksToAdd.length} picks for EK:`);

    for (const pick of picksToAdd) {
      const newPick = await prisma.pick.create({
        data: {
          pickSetId: pickSet.id,
          gameId: pick.game.id,
          choice: pick.choice,
          result: pick.result,
          status: pick.status,
          payout: pick.payout,
          spreadAtPick: 0, // Manual entry
          lineSource: 'manual',
          createdAtUtc: new Date()
        }
      });

      console.log(`   ✅ Added ${pick.team} pick: ${pick.choice} → ${pick.status} (${pick.result})`);
    }

    // Final verification
    const finalPickSet = await prisma.pickSet.findUnique({
      where: { id: pickSet.id },
      include: { picks: true }
    });

    console.log('\n📊 Final Summary for EK:');
    console.log(`   User: ${user.email}`);
    console.log(`   Total picks: ${finalPickSet.picks.length} (should be exactly 3)`);

    const wonPicks = finalPickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = finalPickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);
    console.log(`   Total points: ${wonPicks * 10}`);

    if (finalPickSet.picks.length === 3) {
      console.log('✅ SUCCESS: EK now has exactly 3 picks as required!');
    } else {
      console.log(`⚠️  Warning: EK has ${finalPickSet.picks.length} picks instead of 3`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEKPicks();