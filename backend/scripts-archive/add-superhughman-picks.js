const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSuperHughmanPicks() {
  console.log('🔍 Finding SuperHUGHman user and adding Week 3 picks...\n');

  try {
    // Find SuperHUGHman user by email
    const user = await prisma.user.findFirst({
      where: {
        email: 'hughkwill@gmail.com'
      }
    });

    if (!user) {
      console.log('❌ SuperHUGHman user not found');
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
      console.log('📝 Creating new Week 3 pick set for SuperHUGHman...');
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

      // Clear existing picks to replace with the 3 specified
      if (pickSet.picks.length > 0) {
        console.log('🗑️  Clearing existing picks...');
        await prisma.pick.deleteMany({
          where: { pickSetId: pickSet.id }
        });
        console.log(`✅ Cleared ${pickSet.picks.length} existing picks`);
      }
    }

    // Find the games for Steelers, Chargers, Packers
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        OR: [
          { homeTeam: { contains: 'Steelers' } },
          { awayTeam: { contains: 'Steelers' } },
          { homeTeam: { contains: 'Chargers' } },
          { awayTeam: { contains: 'Chargers' } },
          { homeTeam: { contains: 'Packers' } },
          { awayTeam: { contains: 'Packers' } }
        ]
      }
    });

    console.log('\n🏈 Found games for SuperHUGHman picks:');
    games.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

    // Determine results based on our previous spread winners
    // Steelers - WIN (Steelers were spread winners)
    // Chargers - WIN (Chargers were spread winners)
    // Packers - LOSE (Browns won spread vs Packers)

    const picksToAdd = [];

    // 1. Pittsburgh Steelers game - WIN
    const steelersGame = games.find(g =>
      g.homeTeam.includes('Steelers') || g.awayTeam.includes('Steelers')
    );
    if (steelersGame) {
      const steelersChoice = steelersGame.awayTeam.includes('Steelers') ? 'away' : 'home';
      picksToAdd.push({
        game: steelersGame,
        choice: steelersChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Steelers'
      });
    }

    // 2. Los Angeles Chargers game - WIN
    const chargersGame = games.find(g =>
      g.homeTeam.includes('Chargers') || g.awayTeam.includes('Chargers')
    );
    if (chargersGame) {
      const chargersChoice = chargersGame.awayTeam.includes('Chargers') ? 'away' : 'home';
      picksToAdd.push({
        game: chargersGame,
        choice: chargersChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Chargers'
      });
    }

    // 3. Green Bay Packers game - LOSE (Browns won)
    const packersGame = games.find(g =>
      g.homeTeam.includes('Packers') || g.awayTeam.includes('Packers')
    );
    if (packersGame) {
      const packersChoice = packersGame.awayTeam.includes('Packers') ? 'away' : 'home';
      picksToAdd.push({
        game: packersGame,
        choice: packersChoice,
        result: 'lost:0',
        status: 'lost',
        payout: 0,
        team: 'Packers'
      });
    }

    console.log(`\n🎯 Adding ${picksToAdd.length} picks for SuperHUGHman:`);

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

    console.log('\n📊 Final Summary for SuperHUGHman:');
    console.log(`   User: ${user.username || user.email}`);
    console.log(`   Total picks: ${finalPickSet.picks.length}`);

    const wonPicks = finalPickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = finalPickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);
    console.log(`   Total points: ${wonPicks * 10}`);

    if (finalPickSet.picks.length === 3) {
      console.log('✅ SUCCESS: SuperHUGHman now has exactly 3 Week 3 picks!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSuperHughmanPicks();