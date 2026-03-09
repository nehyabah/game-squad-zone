const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEKPicks() {
  console.log('🔍 Finding EK user (eoin.kidd@lawlibrary.ie) and adding manual picks...\n');

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
      console.log('📝 Creating new Week 3 pick set for EK...');
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

    // Manual picks to add for EK:
    // Titans - LOSE (you said "titans losing")
    // Browns - WIN (Browns won vs Packers)
    // Panthers - WIN (Panthers won vs Falcons)

    const picksToAdd = [];

    // Tennessee Titans game - LOSE
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

    // Cleveland Browns game - WIN
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

    // Carolina Panthers game - WIN
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

    console.log('\n🎯 Adding manual picks for EK:');

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

    console.log('\n📊 Final Summary for EK:');
    console.log(`   User: ${user.email}`);
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

addEKPicks();