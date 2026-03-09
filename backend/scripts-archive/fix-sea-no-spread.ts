import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSeaNoSpread() {
  console.log('🏈 Fixing SEA @ NO spread to -7.5, +7.5...\n');

  try {
    // Find the game (should be week3-9 based on our mapping)
    const game = await prisma.game.findFirst({
      where: {
        id: 'week3-9',
        homeTeam: 'New Orleans Saints',
        awayTeam: 'Seattle Seahawks'
      },
      include: { lines: true }
    });

    if (!game) {
      console.log('❌ Game not found: Seattle Seahawks @ New Orleans Saints (week3-9)');
      return;
    }

    console.log(`📍 Found game: ${game.awayTeam} @ ${game.homeTeam}`);
    console.log(`   Current spread: ${game.lines[0]?.spread || 'No spread'}`);

    // Update the spread to -7.5 (New Orleans favored by 7.5)
    if (game.lines.length > 0) {
      const line = game.lines[0];
      await prisma.gameLine.update({
        where: {
          gameId_source_fetchedAtUtc: {
            gameId: line.gameId,
            source: line.source,
            fetchedAtUtc: line.fetchedAtUtc
          }
        },
        data: {
          spread: -7.5,
          fetchedAtUtc: new Date()
        }
      });
      console.log('   ✅ Updated spread to -7.5 (New Orleans favored by 7.5)');
    } else {
      // Create new game line if none exists
      await prisma.gameLine.create({
        data: {
          gameId: game.id,
          spread: -7.5,
          source: 'manual',
          fetchedAtUtc: new Date()
        }
      });
      console.log('   ✅ Created new spread: -7.5 (New Orleans favored by 7.5)');
    }

    console.log('\n🎯 Spread fix complete!');

  } catch (error) {
    console.error('❌ Error fixing spread:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSeaNoSpread().catch(console.error);