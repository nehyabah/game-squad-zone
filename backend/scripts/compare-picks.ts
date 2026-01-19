import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function compare() {
  const picks = await prisma.pick.findMany({
    where: {
      pickSet: {
        user: { email: 'eoinomahony1@gmail.com' }
      }
    },
    include: {
      pickSet: true
    },
    orderBy: { createdAtUtc: 'asc' }
  });

  const penaltyPicks = picks.filter(p => p.lineSource === 'penalty');
  const regularPicks = picks.filter(p => p.lineSource !== 'penalty');

  console.log(`Total picks: ${picks.length}`);
  console.log(`Penalty picks: ${penaltyPicks.length}`);
  console.log(`Regular picks: ${regularPicks.length}\n`);

  console.log('PENALTY PICK SAMPLE:');
  if (penaltyPicks[0]) {
    const p = penaltyPicks[0];
    console.log(`  status: "${p.status}"`);
    console.log(`  result: "${p.result}"`);
    console.log(`  payout: ${p.payout}`);
    console.log(`  lineSource: "${p.lineSource}"`);
  }

  console.log('\nREGULAR PICK SAMPLE:');
  if (regularPicks[0]) {
    const p = regularPicks[0];
    console.log(`  status: "${p.status}"`);
    console.log(`  result: "${p.result}"`);
    console.log(`  payout: ${p.payout}`);
    console.log(`  lineSource: "${p.lineSource}"`);
  }

  console.log('\nREGULAR PICKS BY RESULT:');
  const byResult: any = {};
  regularPicks.forEach(p => {
    const key = p.result === null ? 'NULL' : p.result;
    byResult[key] = (byResult[key] || 0) + 1;
  });
  Object.entries(byResult).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  console.log('\nREGULAR PICKS BY STATUS:');
  const byStatus: any = {};
  regularPicks.forEach(p => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;
  });
  Object.entries(byStatus).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  await prisma.$disconnect();
}

compare();
