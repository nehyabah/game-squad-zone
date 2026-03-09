const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEoinWeek3Picks() {
  console.log('🔍 Finding Eoin user and adding Week 3 picks...\n');

  try {
    // Find all Eoin users to identify the correct one
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: 'Eoin', mode: 'insensitive' } },
          { username: { contains: 'eoin', mode: 'insensitive' } },
          { email: { contains: 'Eoin', mode: 'insensitive' } },
          { email: { contains: 'eoin', mode: 'insensitive' } },
          { firstName: { contains: 'Eoin', mode: 'insensitive' } }
        ]
      },
      include: {
        pickSets: {
          where: { weekId: '2025-W3' },
          include: { picks: true }
        }
      }
    });

    console.log(`📊 Found ${users.length} Eoin users:`);
    users.forEach(user => {
      const week3PickSet = user.pickSets.find(ps => ps.weekId === '2025-W3');
      console.log(`   ${user.email}: ${week3PickSet ? week3PickSet.picks.length : 0} Week 3 picks`);
    });

    // Find the Eoin that's NOT eoin.kidd@lawlibrary.ie (that's EK)
    const eoinUser = users.find(u => u.email !== 'eoin.kidd@lawlibrary.ie');

    if (!eoinUser) {
      console.log('❌ Eoin user (not EK) not found');
      return;
    }

    console.log(`👤 Found user: ${eoinUser.username || eoinUser.email} (ID: ${eoinUser.id})`);

    // Check if they have a Week 3 pick set
    let pickSet = await prisma.pickSet.findFirst({
      where: {
        userId: eoinUser.id,
        weekId: '2025-W3'
      },
      include: {
        picks: true
      }
    });

    if (!pickSet) {
      console.log('📝 Creating new Week 3 pick set for Eoin...');
      pickSet = await prisma.pickSet.create({
        data: {
          userId: eoinUser.id,
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

    // Find the games for Seattle, 49ers, Ravens
    const games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3',
        OR: [
          { homeTeam: { contains: 'Seahawks' } },
          { awayTeam: { contains: 'Seahawks' } },
          { homeTeam: { contains: '49ers' } },
          { awayTeam: { contains: '49ers' } },
          { homeTeam: { contains: 'Ravens' } },
          { awayTeam: { contains: 'Ravens' } }
        ]
      }
    });

    console.log('\n🏈 Found games for Eoin Week 3 picks:');
    games.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

    // Create exactly 3 picks for Eoin Week 3:
    // Seattle - WIN (Seahawks won vs Saints 44-13)
    // 49ers - LOSE (Cardinals won spread vs 49ers)
    // Ravens - LOSE (Lions won vs Ravens 38-30)

    const picksToAdd = [];

    // 1. Seattle Seahawks game - WIN
    const seahawksGame = games.find(g =>
      g.homeTeam.includes('Seahawks') || g.awayTeam.includes('Seahawks')
    );
    if (seahawksGame) {
      const seahawksChoice = seahawksGame.awayTeam.includes('Seahawks') ? 'away' : 'home';
      picksToAdd.push({
        game: seahawksGame,
        choice: seahawksChoice,
        result: 'won:10',
        status: 'won',
        payout: 10,
        team: 'Seahawks'
      });
    }

    // 2. San Francisco 49ers game - LOSE
    const ninesGame = games.find(g =>
      g.homeTeam.includes('49ers') || g.awayTeam.includes('49ers')
    );
    if (ninesGame) {
      const ninesChoice = ninesGame.awayTeam.includes('49ers') ? 'away' : 'home';
      picksToAdd.push({
        game: ninesGame,
        choice: ninesChoice,
        result: 'lost:0',
        status: 'lost',
        payout: 0,
        team: '49ers'
      });
    }

    // 3. Baltimore Ravens game - LOSE
    const ravensGame = games.find(g =>
      g.homeTeam.includes('Ravens') || g.awayTeam.includes('Ravens')
    );
    if (ravensGame) {
      const ravensChoice = ravensGame.awayTeam.includes('Ravens') ? 'away' : 'home';
      picksToAdd.push({
        game: ravensGame,
        choice: ravensChoice,
        result: 'lost:0',
        status: 'lost',
        payout: 0,
        team: 'Ravens'
      });
    }

    console.log(`\n🎯 Adding ${picksToAdd.length} Week 3 picks for Eoin:`);

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

    console.log('\n📊 Final Summary for Eoin Week 3:');
    console.log(`   User: ${eoinUser.username || eoinUser.email}`);
    console.log(`   Total picks: ${finalPickSet.picks.length}`);

    const wonPicks = finalPickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = finalPickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);
    console.log(`   Total points: ${wonPicks * 10}`);

    if (finalPickSet.picks.length === 3) {
      console.log('✅ SUCCESS: Eoin now has exactly 3 Week 3 picks!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addEoinWeek3Picks();