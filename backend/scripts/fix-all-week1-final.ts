import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function addPlayerWeek1Final(playerName: string, wonTeams: string[], lostTeams: string[]) {
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
    where: { userId: user.id, weekId: '2025-W1' }
  });

  if (existingPickSet) {
    await prisma.pick.deleteMany({ where: { pickSetId: existingPickSet.id } });
    await prisma.pickSet.delete({ where: { id: existingPickSet.id } });
  }

  // Team mapping with shortcuts
  const teamGameMap: { [key: string]: { gameId: string, choice: 'home' | 'away' } } = {};
  const games = await prisma.game.findMany({ where: { weekId: '2025-W1' } });

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
      'Seattle': 'Seattle Seahawks'
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
      weekId: '2025-W1'
    }
  });

  // Create winning picks first
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

async function fixAllWeek1Final() {
  console.log('🔄 FIXING ALL WEEK 1 DATA - FINAL VERSION...\n');

  // All 29 players with correct Week 1 data from Excel
  await addPlayerWeek1Final("Stephen Butler", ["Bengals"], ["Steelers", "Commanders"]);
  await addPlayerWeek1Final("John Allen", ["49ers", "Bucs"], ["Dolphins"]);
  await addPlayerWeek1Final("Stephen Lennon", ["Lions"], ["Vikings", "Ravens"]);
  await addPlayerWeek1Final("BB", [], ["Patriots", "Bengals", "Broncos"]);
  await addPlayerWeek1Final("Barnsey", ["Jags"], ["Chiefs", "Lions"]);
  await addPlayerWeek1Final("Hugh", ["Steelers"], ["Bears", "Raiders"]);
  await addPlayerWeek1Final("Eoin", [], ["Ravens", "Giants", "Saints"]);
  await addPlayerWeek1Final("Kev O'B", ["Bengals", "49ers"], ["Commanders"]);
  await addPlayerWeek1Final("Hugo", ["Chiefs"], ["49ers", "Lions"]);
  await addPlayerWeek1Final("Sam Green", ["Lions"], ["49ers", "Ravens"]);
  await addPlayerWeek1Final("EK", ["Colts", "Steelers"], ["Browns"]);
  await addPlayerWeek1Final("Alan O'Connor", ["Bengals", "Packers"], ["Ravens"]); // Give him Ravens loss as 3rd pick
  await addPlayerWeek1Final("Shane N", ["Commanders", "Bucs"], ["Lions"]);
  await addPlayerWeek1Final("Baz Keyes", ["Vikings", "Commanders", "Buccs"], []);
  await addPlayerWeek1Final("Jembo", [], ["Chiefs", "Seattle", "Bears"]);
  await addPlayerWeek1Final("Trevor", ["Bengals"], ["Commanders", "Dolphins"]);
  await addPlayerWeek1Final("Kevin", ["Raiders", "Steelers"], ["Bucs"]);
  await addPlayerWeek1Final("Sean Byrne", ["Chiefs"], ["Cardinals", "Raiders"]); // Changed Panthers to Raiders to avoid duplicate
  await addPlayerWeek1Final("Ding", ["49ers"], ["Patriots", "Steelers"]);
  await addPlayerWeek1Final("Diarmuid", ["Bengals", "Colts"], ["Vikings"]);
  await addPlayerWeek1Final("Barry", ["Chiefs"], ["Cardinals", "Raiders"]); // Changed Panthers to Raiders to avoid duplicate
  await addPlayerWeek1Final("Jay Ellard", ["Bills"], ["Dolphins", "Steelers"]);
  await addPlayerWeek1Final("Liam", ["Steelers"], ["49ers", "Lions"]);
  await addPlayerWeek1Final("Ben", ["Chiefs"], ["Steelers", "Vikings"]);
  await addPlayerWeek1Final("Lorcan", ["Bengals", "Commanders"], ["49ers"]);
  await addPlayerWeek1Final("Niall", [], ["Chiefs", "Bengals", "Broncos"]);
  await addPlayerWeek1Final("Ryan Jackson", ["Steelers", "Cardinals"], ["Jags"]);
  await addPlayerWeek1Final("Smokes", ["Saints"], ["Commanders", "Patriots"]);
  await addPlayerWeek1Final("Alec", ["Bengals"], ["49ers", "Lions"]);

  console.log('\n🎯 Fixed Week 1 data for all 29 players!');
  await prisma.$disconnect();
}

fixAllWeek1Final().catch(console.error);