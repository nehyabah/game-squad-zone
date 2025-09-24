/**
 * Spread Calculation Utilities
 * Handles point spread betting calculations for NFL games
 */

export interface SpreadCalculationResult {
  userWon: boolean;
  homeCovers: boolean;
  awayCovers: boolean;
  isPush: boolean;
  actualMargin: number;
  adjustedMargin: number;
  explanation: string;
  points: number;
}

/**
 * Calculate if a user's spread pick won based on final game scores
 *
 * @param homeScore - Final home team score
 * @param awayScore - Final away team score
 * @param spreadAtPick - Spread from home team perspective when pick was made
 * @param userChoice - User's pick: 'home' or 'away'
 * @returns SpreadCalculationResult with all calculation details
 */
export function calculateSpreadResult(
  homeScore: number,
  awayScore: number,
  spreadAtPick: number,
  userChoice: 'home' | 'away'
): SpreadCalculationResult {

  // Input validation
  if (homeScore == null || awayScore == null || spreadAtPick == null) {
    throw new Error('Missing required parameters for spread calculation');
  }

  if (!['home', 'away'].includes(userChoice)) {
    throw new Error(`Invalid user choice: ${userChoice}. Must be 'home' or 'away'`);
  }

  // Step 1: Calculate actual game margin (positive = home won, negative = away won)
  const actualMargin = homeScore - awayScore;

  // Step 2: Apply spread as handicap to home team
  // If spread is -6.5, home team needs to win by MORE than 6.5
  // If spread is +3.5, home team can lose by UP TO 3.5 and still "cover"
  const adjustedHomeScore = homeScore + spreadAtPick;
  const adjustedMargin = adjustedHomeScore - awayScore;

  // Step 3: Determine who covered the spread
  let homeCovers: boolean;
  let awayCovers: boolean;
  let isPush: boolean;

  if (adjustedMargin > 0) {
    homeCovers = true;
    awayCovers = false;
    isPush = false;
  } else if (adjustedMargin < 0) {
    homeCovers = false;
    awayCovers = true;
    isPush = false;
  } else {
    // Exact tie after spread adjustment (very rare with .5 spreads)
    homeCovers = false;
    awayCovers = false;
    isPush = true;
  }

  // Step 4: Check if user's pick won
  let userWon: boolean;
  let points: number;

  if (isPush) {
    userWon = false; // Pushes are treated as no-win in most systems
    points = 0;
  } else {
    userWon = (userChoice === 'home' && homeCovers) ||
              (userChoice === 'away' && awayCovers);
    points = userWon ? 10 : 0; // Standard points per win
  }

  // Step 5: Generate human-readable explanation
  const explanation = generateExplanation(
    homeScore, awayScore, spreadAtPick, userChoice,
    actualMargin, adjustedMargin, homeCovers, awayCovers, isPush
  );

  return {
    userWon,
    homeCovers,
    awayCovers,
    isPush,
    actualMargin,
    adjustedMargin,
    explanation,
    points
  };
}

/**
 * Generate human-readable explanation of the spread calculation
 */
function generateExplanation(
  homeScore: number,
  awayScore: number,
  spreadAtPick: number,
  userChoice: 'home' | 'away',
  actualMargin: number,
  adjustedMargin: number,
  homeCovers: boolean,
  awayCovers: boolean,
  isPush: boolean
): string {

  const homeWonGame = actualMargin > 0;
  const marginAbs = Math.abs(actualMargin);
  const spreadAbs = Math.abs(spreadAtPick);

  // Game result description
  let gameResult: string;
  if (actualMargin > 0) {
    gameResult = `Home won ${homeScore}-${awayScore} (by ${marginAbs})`;
  } else if (actualMargin < 0) {
    gameResult = `Away won ${awayScore}-${homeScore} (by ${marginAbs})`;
  } else {
    gameResult = `Game tied ${homeScore}-${awayScore}`;
  }

  // Spread requirement description
  let spreadReq: string;
  if (spreadAtPick < 0) {
    spreadReq = `Home needed to win by more than ${spreadAbs}`;
  } else if (spreadAtPick > 0) {
    spreadReq = `Home could lose by up to ${spreadAbs} and still cover`;
  } else {
    spreadReq = `No spread (pick 'em game)`;
  }

  // Cover result
  let coverResult: string;
  if (isPush) {
    coverResult = `Push (exact tie on spread)`;
  } else if (homeCovers) {
    coverResult = `Home covered the spread`;
  } else {
    coverResult = `Away covered the spread`;
  }

  // User pick result
  const userPicked = userChoice === 'home' ? 'Home' : 'Away';
  const userResult = isPush ? 'Push (no win)' :
                    (homeCovers && userChoice === 'home') || (awayCovers && userChoice === 'away') ?
                    'WIN' : 'LOSS';

  return `${gameResult}. ${spreadReq}. ${coverResult}. You picked: ${userPicked}. Result: ${userResult}`;
}

/**
 * Test the spread calculation function with known examples
 */
export function testSpreadCalculation(): void {
  console.log('🧪 Testing Spread Calculation Function\n');

  const testCases = [
    {
      name: 'Jets vs Bucs Example (from database)',
      homeScore: 27, // Jets (home)
      awayScore: 29, // Bucs (away)
      spreadAtPick: -6.5, // Jets favored by 6.5
      userChoice: 'home' as const,
      expectedUserWon: false // Jets lost by 2, needed to win by 6.5+
    },
    {
      name: 'Home covers easily',
      homeScore: 28,
      awayScore: 14,
      spreadAtPick: -7.5,
      userChoice: 'home' as const,
      expectedUserWon: true // Home won by 14, needed 7.5+
    },
    {
      name: 'Underdog covers by losing less',
      homeScore: 21,
      awayScore: 17,
      spreadAtPick: -7.5, // Home favored by 7.5
      userChoice: 'away' as const,
      expectedUserWon: true // Home won by 4, less than 7.5 spread
    },
    {
      name: 'Underdog wins outright',
      homeScore: 14,
      awayScore: 21,
      spreadAtPick: -3.5,
      userChoice: 'away' as const,
      expectedUserWon: true // Away won outright
    }
  ];

  testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);

    try {
      const result = calculateSpreadResult(
        test.homeScore,
        test.awayScore,
        test.spreadAtPick,
        test.userChoice
      );

      console.log(`  Result: ${result.userWon ? 'WIN' : 'LOSS'} (${result.points} pts)`);
      console.log(`  Expected: ${test.expectedUserWon ? 'WIN' : 'LOSS'}`);
      console.log(`  ✅ ${result.userWon === test.expectedUserWon ? 'CORRECT' : '❌ WRONG'}`);
      console.log(`  Explanation: ${result.explanation}`);

    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }

    console.log('');
  });
}