const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addEoinPicks() {
  console.log('🔍 Finding Eoin user and adding manual picks...\n');

  try {
    // Find Eoin user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { contains: 'Eoin', mode: 'insensitive' } },
          { username: { contains: 'eoin', mode: 'insensitive' } },
          { email: { contains: 'Eoin', mode: 'insensitive' } },
          { email: { contains: 'eoin', mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      console.log('❌ Eoin user not found');
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
      console.log('📝 Creating new Week 3 pick set...');
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

    // Find the games for Seattle, 49ers, Ravens
    const targetTeams = ['Seahawks', '49ers', 'Ravens'];
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

    console.log('\n🏈 Found games for target teams:');
    games.forEach(game => {
      console.log(`   ${game.id}: ${game.awayTeam} @ ${game.homeTeam} (${game.awayScore}-${game.homeScore})`);
    });

    // Manual picks to add:
    // Seattle - WIN (only winner)
    // 49ers - LOSE
    // Ravens - LOSE

    const picksToAdd = [];

    // Seattle Seahawks game - WIN
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

    // 49ers game - LOSE
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

    // Ravens game - LOSE
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

    console.log('\n🎯 Adding manual picks:');

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

    console.log('\n📊 Final Summary:');
    console.log(`   User: ${user.username || user.email}`);
    console.log(`   Total picks: ${finalPickSet.picks.length}`);
    console.log(`   Manual picks added: ${picksToAdd.length}`);

    const wonPicks = finalPickSet.picks.filter(p => p.status === 'won').length;
    const lostPicks = finalPickSet.picks.filter(p => p.status === 'lost').length;

    console.log(`   Won picks: ${wonPicks}`);
    console.log(`   Lost picks: ${lostPicks}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addEoinPicks();