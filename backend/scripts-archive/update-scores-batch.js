const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Complete score data from user
const scoreData = {
  "games": [
    {
      "homeTeam": "Carolina Panthers",
      "awayTeam": "Atlanta Falcons",
      "homeScore": 30,
      "awayScore": 0
    },
    {
      "homeTeam": "Cleveland Browns",
      "awayTeam": "Green Bay Packers",
      "homeScore": 13,
      "awayScore": 10
    },
    {
      "homeTeam": "Jacksonville Jaguars",
      "awayTeam": "Houston Texans",
      "homeScore": 17,
      "awayScore": 10
    },
    {
      "homeTeam": "Minnesota Vikings",
      "awayTeam": "Cincinnati Bengals",
      "homeScore": 48,
      "awayScore": 10
    },
    {
      "homeTeam": "New England Patriots",
      "awayTeam": "Pittsburgh Steelers",
      "homeScore": 14,
      "awayScore": 21
    },
    {
      "homeTeam": "Philadelphia Eagles",
      "awayTeam": "Los Angeles Rams",
      "homeScore": 33,
      "awayScore": 26
    },
    {
      "homeTeam": "Tampa Bay Buccaneers",
      "awayTeam": "New York Jets",
      "homeScore": 29,
      "awayScore": 27
    },
    {
      "homeTeam": "Tennessee Titans",
      "awayTeam": "Indianapolis Colts",
      "homeScore": 20,
      "awayScore": 41
    },
    {
      "homeTeam": "Washington Commanders",
      "awayTeam": "Las Vegas Raiders",
      "homeScore": 41,
      "awayScore": 24
    },
    {
      "homeTeam": "Los Angeles Chargers",
      "awayTeam": "Denver Broncos",
      "homeScore": 23,
      "awayScore": 20
    },
    {
      "homeTeam": "Seattle Seahawks",
      "awayTeam": "New Orleans Saints",
      "homeScore": 44,
      "awayScore": 13
    },
    {
      "homeTeam": "Chicago Bears",
      "awayTeam": "Dallas Cowboys",
      "homeScore": 31,
      "awayScore": 14
    },
    {
      "homeTeam": "San Francisco 49ers",
      "awayTeam": "Arizona Cardinals",
      "homeScore": 16,
      "awayScore": 15
    }
  ]
};

async function updateAllScores() {
  console.log('🎯 Updating Week 3 scores...\n');

  try {
    // Get all Week 3 games
    const week3Games = await prisma.game.findMany({
      where: {
        weekId: '2025-W3'
      }
    });

    console.log(`📊 Found ${week3Games.length} Week 3 games in database`);
    console.log(`📊 Processing ${scoreData.games.length} game scores\n`);

    let updated = 0;
    let notFound = 0;

    for (const scoreGame of scoreData.games) {
      // Find matching game by team names (checking both orientations)
      const matchingGame = week3Games.find(game => {
        const match1 = game.homeTeam === scoreGame.homeTeam && game.awayTeam === scoreGame.awayTeam;
        const match2 = game.homeTeam === scoreGame.awayTeam && game.awayTeam === scoreGame.homeTeam;
        return match1 || match2;
      });

      if (matchingGame) {
        // Determine correct score assignment
        let finalAwayScore, finalHomeScore;
        if (matchingGame.homeTeam === scoreGame.homeTeam) {
          finalAwayScore = scoreGame.awayScore;
          finalHomeScore = scoreGame.homeScore;
        } else {
          finalAwayScore = scoreGame.homeScore;
          finalHomeScore = scoreGame.awayScore;
        }

        console.log(`🔄 ${matchingGame.awayTeam} @ ${matchingGame.homeTeam}: ${finalAwayScore} - ${finalHomeScore}`);

        await prisma.game.update({
          where: { id: matchingGame.id },
          data: {
            awayScore: parseInt(finalAwayScore),
            homeScore: parseInt(finalHomeScore),
            completed: true
          }
        });

        console.log(`✅ Updated successfully`);
        updated++;
      } else {
        console.log(`❌ No match found for: ${scoreGame.awayTeam} @ ${scoreGame.homeTeam}`);
        notFound++;
      }
      console.log('');
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`  ✅ Successfully updated: ${updated} games`);
    console.log(`  ❌ Not found: ${notFound} games`);

    // Verify picks remain untouched
    const picks = await prisma.pick.findMany({
      where: {
        game: { weekId: '2025-W3' }
      }
    });

    const picksWithResults = picks.filter(p => p.result && p.result !== 'pending');
    console.log(`\n🎯 Pick Status Check:`);
    console.log(`  - Total picks: ${picks.length}`);
    console.log(`  - Picks with results: ${picksWithResults.length} (should be 0)`);

    if (picksWithResults.length === 0) {
      console.log('✅ SUCCESS: All scores updated, pick results remain pending for spread calculation');
    } else {
      console.log('⚠️  WARNING: Some picks have calculated results');
    }

    return { updated, notFound };

  } catch (error) {
    console.error('❌ Error updating scores:', error);
    throw error;
  }
}

async function main() {
  console.log('🏈 Week 3 Score Batch Update\n');
  console.log('This will update scores only - NO pick result calculations\n');

  try {
    const result = await updateAllScores();
    console.log('\n🎉 Batch update completed!');
  } catch (error) {
    console.error('💥 Batch update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateAllScores };