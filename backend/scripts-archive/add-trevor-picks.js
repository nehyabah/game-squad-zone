const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTrevorPicks() {
  console.log('🔍 Finding Trevor user and adding Week 2 picks...\n');

  try {
    // Find Trevor user by email
    const user = await prisma.user.findFirst({
      where: {
        email: 'tubes90@hotmail.com'
      }
    });

    if (!user) {
      console.log('❌ Trevor user not found');
      return;
    }

    console.log(`👤 Found user: ${user.username || user.email} (ID: ${user.id})`);

    // Check if they have a Week 2 pick set
    let pickSet = await prisma.pickSet.findFirst({
      where: {
        userId: user.id,
        weekId: '2025-W2'
      },
      include: {
        picks: true
      }
    });

    if (!pickSet) {
      console.log('📝 Creating new Week 2 pick set for Trevor...');
      pickSet = await prisma.pickSet.create({
        data: {
          userId: user.id,
          weekId: '2025-W2',
          status: 'locked',
          submittedAtUtc: new Date(),
          lockedAtUtc: new Date()
        },
        include: {
          picks: true
        }
      });
      console.log(`✅ Created pick set: ${pickSet.id}`);
    } else {
      console.log(`📋 Found existing pick set: ${pickSet.id} (${pickSet.picks.length} picks)`);

      // Clear existing picks to replace with the 3 specified
      if (pickSet.picks.length > 0) {
        console.log('🗑️  Clearing existing picks...');
        await prisma.pick.deleteMany({
          where: { pickSetId: pickSet.id }
        });
        console.log(`✅ Cleared ${pickSet.picks.length} existing picks`);
      }
    }

    // Find the games for Rams, Broncos, Eagles
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W2',
        OR: [
          { homeTeam: { contains: 'Rams' } },
          { awayTeam: { contains: 'Rams' } },
          { homeTeam: { contains: 'Broncos' } },
          { awayTeam: { contains: 'Broncos' } },
          { homeTeam: { contains: 'Eagles' } },
          { awayTeam: { contains: 'Eagles' } }
        ]
      }
    });

    console.log('\n🏈 Found games for Trevor Week 2 picks:');
    games.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

    // Create exactly 3 picks for Trevor Week 2:
    // Rams - WIN
    // Broncos - LOSE (you said "lost broncos")
    // Eagles - WIN

    const picksToAdd = [];

    // 1. Los Angeles Rams game - WIN
    const ramsGame = games.find(g =>
      g.homeTeam.includes('Rams') || g.awayTeam.includes('Rams')
    );
    if (ramsGame) {
      const ramsChoice = ramsGame.awayTeam.includes('Rams') ? 'away' : 'home';
      picksToAdd.push({
        game: ramsGame,
        choice: ramsChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Rams'
      });
    }

    // 2. Denver Broncos game - LOSE
    const broncosGame = games.find(g =>
      g.homeTeam.includes('Broncos') || g.awayTeam.includes('Broncos')
    );
    if (broncosGame) {
      const broncosChoice = broncosGame.awayTeam.includes('Broncos') ? 'away' : 'home';
      picksToAdd.push({
        game: broncosGame,
        choice: broncosChoice,
        result: 'lost:0',
        status: 'lost',
        payout: 0,
        team: 'Broncos'
      });
    }

    // 3. Philadelphia Eagles game - WIN
    const eaglesGame = games.find(g =>
      g.homeTeam.includes('Eagles') || g.awayTeam.includes('Eagles')
    );
    if (eaglesGame) {
      const eaglesChoice = eaglesGame.awayTeam.includes('Eagles') ? 'away' : 'home';
      picksToAdd.push({
        game: eaglesGame,
        choice: eaglesChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Eagles'
      });
    }

    console.log(`\n🎯 Adding ${picksToAdd.length} Week 2 picks for Trevor:`);

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

    // Final summary
    const finalPickSet = await prisma.pickSet.findUnique({
      where: { id: pickSet.id },
      include: { picks: true }
    });

    console.log('\n📊 Final Summary for Trevor Week 2:');
    console.log(`   User: ${user.username || user.email}`);
    console.log(`   Total picks: ${finalPickSet.picks.length}`);

    const wonPicks = finalPickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = finalPickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);
    console.log(`   Total points: ${wonPicks * 10}`);

    if (finalPickSet.picks.length === 3) {
      console.log('✅ SUCCESS: Trevor now has exactly 3 Week 2 picks!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTrevorPicks();