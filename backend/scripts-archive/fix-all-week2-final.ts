import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function addPlayerWeek2Final(playerName: string, wonTeams: string[], lostTeams: string[]) {
  console.log('👤 Fixing ' + playerName + '...');

  // Find user by displayName or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { displayName: { contains: playerName } },
        { email: playerName === "Alan O'Connor" ? "alanoc9@hotmail.com" : undefined }
      ].filter(Boolean)
    }
  });

  // Try alternative searches for specific users
  if (!user && playerName === "Sean Byrne") {
    user = await prisma.user.findFirst({
      where: { displayName: { contains: "Sean" } }
    });
  }

  if (!user && playerName === "Hugh") {
    user = await prisma.user.findFirst({
      where: { displayName: { contains: "SuperHUGH" } }
    });
  }

  if (!user) {
    console.log('❌ ' + playerName + ' not found');
    return;
  }

  // Clear existing picks
  const existingPickSet = await prisma.pickSet.findFirst({
    where: { userId: user.id, weekId: '2025-W2' }
  });

  if (existingPickSet) {
    await prisma.pick.deleteMany({ where: { pickSetId: existingPickSet.id } });
    await prisma.pickSet.delete({ where: { id: existingPickSet.id } });
  }

  // Team mapping with shortcuts
  const teamGameMap: { [key: string]: { gameId: string, choice: 'home' | 'away' } } = {};
  const games = await prisma.game.findMany({ where: { weekId: '2025-W2' } });

  games.forEach(game => {
    teamGameMap[game.homeTeam] = { gameId: game.id, choice: 'home' };
    teamGameMap[game.awayTeam] = { gameId: game.id, choice: 'away' };

    // Add team shortcuts
    const shortcuts: { [key: string]: string } = {
      'Chiefs': 'Kansas City Chiefs',
      'Bengals': 'Cincinnati Bengals',
      'Broncos': 'Denver Broncos',
      'Steelers': 'Pittsburgh Steelers',
      'Cardinals': 'Arizona Cardinals',
      'Jags': 'Jacksonville Jaguars',
      'Saints': 'New Orleans Saints',
      'Commanders': 'Washington Commanders',
      'Patriots': 'New England Patriots',
      'Pats': 'New England Patriots',
      'Bills': 'Buffalo Bills',
      'Eagles': 'Philadelphia Eagles',
      'Cowboys': 'Dallas Cowboys',
      'Rams': 'Los Angeles Rams',
      'Chargers': 'Los Angeles Chargers',
      '49ers': 'San Francisco 49ers',
      'Packers': 'Green Bay Packers',
      'Lions': 'Detroit Lions',
      'Bears': 'Chicago Bears',
      'Vikings': 'Minnesota Vikings',
      'Falcons': 'Atlanta Falcons',
      'Panthers': 'Carolina Panthers',
      'Bucs': 'Tampa Bay Buccaneers',
      'Buccs': 'Tampa Bay Buccaneers',
      'Titans': 'Tennessee Titans',
      'Colts': 'Indianapolis Colts',
      'Texans': 'Houston Texans',
      'Ravens': 'Baltimore Ravens',
      'Browns': 'Cleveland Browns',
      'Dolphins': 'Miami Dolphins',
      'Jets': 'New York Jets',
      'Giants': 'New York Giants',
      'Raiders': 'Las Vegas Raiders',
      'Seahawks': 'Seattle Seahawks',
      'Seattle': 'Seattle Seahawks',
      'Denver': 'Denver Broncos'
    };

    Object.entries(shortcuts).forEach(([short, full]) => {
      if (teamGameMap[full]) {
        teamGameMap[short] = teamGameMap[full];
      }
    });
  });

  // Create pick set
  const pickSet = await prisma.pickSet.create({
    data: {
      id: randomUUID(),
      userId: user.id,
      weekId: '2025-W2'
    }
  });

  // Create winning picks
  for (const teamName of wonTeams) {
    const gameMapping = teamGameMap[teamName];
    if (!gameMapping) {
      console.log('❌ Could not find game for team: ' + teamName);
      continue;
    }

    await prisma.pick.create({
      data: {
        id: randomUUID(),
        pickSetId: pickSet.id,
        gameId: gameMapping.gameId,
        choice: gameMapping.choice,
        status: 'won',
        result: 'won:10',
        spreadAtPick: 0.0,
        lineSource: 'manual',
        createdAtUtc: new Date()
      }
    });
  }

  // Create losing picks
  for (const teamName of lostTeams) {
    const gameMapping = teamGameMap[teamName];
    if (!gameMapping) {
      console.log('❌ Could not find game for team: ' + teamName);
      continue;
    }

    await prisma.pick.create({
      data: {
        id: randomUUID(),
        pickSetId: pickSet.id,
        gameId: gameMapping.gameId,
        choice: gameMapping.choice,
        status: 'lost',
        result: 'lost:0',
        spreadAtPick: 0.0,
        lineSource: 'manual',
        createdAtUtc: new Date()
      }
    });
  }

  console.log('✅ ' + playerName + ': ' + wonTeams.length + 'W-' + lostTeams.length + 'L');
}

async function fixAllWeek2Final() {
  console.log('🔄 FIXING ALL WEEK 2 DATA - FINAL VERSION...\n');

  // All 29 players with correct Week 2 data from Excel
  await addPlayerWeek2Final("Stephen Butler", ["Bengals", "Bills"], ["Steelers"]);
  await addPlayerWeek2Final("John Allen", ["Eagles", "Seahawks"], ["Broncos"]);
  await addPlayerWeek2Final("Stephen Lennon", ["Bengals", "Eagles"], ["Cardinals"]);
  await addPlayerWeek2Final("BB", ["Lions"], ["Cardinals", "Broncos"]);
  await addPlayerWeek2Final("Barnsey", ["Eagles", "Chargers"], ["Cowboys"]);
  await addPlayerWeek2Final("Hugh", ["Falcons"], ["Steelers", "Raiders"]);
  await addPlayerWeek2Final("Eoin", ["Pats"], ["Cowboys", "Jets"]);
  await addPlayerWeek2Final("Kev O'B", ["Bills", "49ers"], ["Steelers"]);
  await addPlayerWeek2Final("Hugo", ["Bills", "Bengals", "Lions"], []);
  await addPlayerWeek2Final("Sam Green", ["Bills", "Lions", "49ers"], []);
  await addPlayerWeek2Final("EK", ["Eagles", "Chargers"], ["Cowboys"]);
  await addPlayerWeek2Final("Alan O'Connor", ["Chargers", "Bengals"], ["Vikings"]);
  await addPlayerWeek2Final("Shane N", ["Colts", "Bucs"], ["Cardinals"]);
  await addPlayerWeek2Final("Baz Keyes", ["Bengals", "49ers"], ["Cowboys"]);
  await addPlayerWeek2Final("Jembo", ["Pats"], ["Cowboys", "Denver"]);
  await addPlayerWeek2Final("Trevor", ["Rams", "Eagles"], ["Broncos"]);
  await addPlayerWeek2Final("Kevin", ["Bills", "49ers"], ["Cowboys"]);
  await addPlayerWeek2Final("Sean Byrne", ["Bills", "Lions", "Rams"], []);
  await addPlayerWeek2Final("Ding", ["Eagles"], ["Cardinals", "Cowboys"]);
  await addPlayerWeek2Final("Diarmuid", ["Rams", "Bucs"], ["Broncos"]);
  await addPlayerWeek2Final("Barry", ["Eagles"], ["Cowboys", "Vikings"]);
  await addPlayerWeek2Final("Jay Ellard", ["Lions"], ["Texans", "Dolphins"]);
  await addPlayerWeek2Final("Liam", ["Colts"], ["Steelers", "Saints"]);
  await addPlayerWeek2Final("Ben", ["Lions"], ["Dolphins", "Vikings"]);
  await addPlayerWeek2Final("Lorcan", ["Bills", "Ravens", "Chargers"], []);
  await addPlayerWeek2Final("Niall", ["Bengals", "Eagles"], ["Steelers"]);
  await addPlayerWeek2Final("Ryan Jackson", ["Chargers", "Eagles"], ["Steelers"]);
  await addPlayerWeek2Final("Smokes", ["Bengals"], ["Titans", "Cowboys"]);
  await addPlayerWeek2Final("Alec", ["Lions"], ["Steelers", "Cowboys"]);

  console.log('\n🎯 Fixed Week 2 data for all 29 players!');
  await prisma.$disconnect();
}

fixAllWeek2Final().catch(console.error);