const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addHugoPicks() {
  console.log('🔍 Finding Hugo user and adding manual picks...\n');

  try {
    // Find Hugo user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: 'Hugo', mode: 'insensitive' } },
          { username: { contains: 'hugo', mode: 'insensitive' } },
          { email: { contains: 'Hugo', mode: 'insensitive' } },
          { email: { contains: 'hugo', mode: 'insensitive' } },
          { firstName: { contains: 'Hugo', mode: 'insensitive' } },
          { firstName: { contains: 'hugo', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      console.log('❌ Hugo user not found');
      return;
    }

    console.log(`👤 Found user: ${user.username || user.email} (ID: ${user.id})`);

    // Check if they have a Week 3 pick set
    let pickSet = await prisma.pickSet.findFirst({
      where: {
        userId: user.id,
        weekId: '2025-W3'
      },
      include: {
        picks: true
      }
    });

    if (!pickSet) {
      console.log('📝 Creating new Week 3 pick set for Hugo...');
      pickSet = await prisma.pickSet.create({
        data: {
          userId: user.id,
          weekId: '2025-W3',
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
    }

    // Find the games for Eagles, Washington, Jags
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        OR: [
          { homeTeam: { contains: 'Eagles' } },
          { awayTeam: { contains: 'Eagles' } },
          { homeTeam: { contains: 'Washington' } },
          { awayTeam: { contains: 'Washington' } },
          { homeTeam: { contains: 'Commanders' } },
          { awayTeam: { contains: 'Commanders' } },
          { homeTeam: { contains: 'Jaguars' } },
          { awayTeam: { contains: 'Jaguars' } }
        ]
      }
    });

    console.log('\n🏈 Found games for Hugo picks:');
    games.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

    // Manual picks to add for Hugo - ALL WINS:
    // Eagles - WIN (Eagles won vs Rams)
    // Washington - WIN (Washington won vs Raiders)
    // Jags - WIN (Jags won vs Texans)

    const picksToAdd = [];

    // Philadelphia Eagles game - WIN
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

    // Washington Commanders game - WIN
    const washingtonGame = games.find(g =>
      g.homeTeam.includes('Washington') || g.awayTeam.includes('Washington') ||
      g.homeTeam.includes('Commanders') || g.awayTeam.includes('Commanders')
    );
    if (washingtonGame) {
      const washingtonChoice = washingtonGame.awayTeam.includes('Washington') || washingtonGame.awayTeam.includes('Commanders') ? 'away' : 'home';
      picksToAdd.push({
        game: washingtonGame,
        choice: washingtonChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Washington'
      });
    }

    // Jacksonville Jaguars game - WIN
    const jagsGame = games.find(g =>
      g.homeTeam.includes('Jaguars') || g.awayTeam.includes('Jaguars')
    );
    if (jagsGame) {
      const jagsChoice = jagsGame.awayTeam.includes('Jaguars') ? 'away' : 'home';
      picksToAdd.push({
        game: jagsGame,
        choice: jagsChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Jags'
      });
    }

    console.log('\n🎯 Adding manual picks for Hugo (ALL WINS):');

    for (const pick of picksToAdd) {
      // Check if pick already exists
      const existingPick = await prisma.pick.findFirst({
        where: {
          pickSetId: pickSet.id,
          gameId: pick.game.id
        }
      });

      if (existingPick) {
        console.log(`   ⚠️  ${pick.team} pick already exists for this game - skipping`);
        continue;
      }

      // Create the pick
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

    console.log('\n📊 Final Summary for Hugo:');
    console.log(`   User: ${user.username || user.email}`);
    console.log(`   Total picks: ${finalPickSet.picks.length}`);
    console.log(`   Manual picks added: ${picksToAdd.length}`);

    const wonPicks = finalPickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = finalPickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);
    console.log(`   Total points: ${wonPicks * 10}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addHugoPicks();