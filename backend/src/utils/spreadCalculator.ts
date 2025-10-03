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
 * @param spreadAtPick - Spread from USER'S perspective (what they clicked and saw)
 * @param userChoice - User's pick: 'home' or 'away'
 * @returns SpreadCalculationResult with all calculation details
 */
export function calculateSpreadResult(
  homeScore: number,
  awayScore: number,
  spreadAtPick: number,
  userChoice: "home" | "away"
): SpreadCalculationResult {
  // Input validation
  if (homeScore == null || awayScore == null || spreadAtPick == null) {
    throw new Error("Missing required parameters for spread calculation");
  }

  if (!["home", "away"].includes(userChoice)) {
    throw new Error(
      `Invalid user choice: ${userChoice}. Must be 'home' or 'away'`
    );
  }

  // Step 1: Calculate actual game margin (positive = home won, negative = away won)
  const actualMargin = homeScore - awayScore;

  // Step 2: Calculate if user's pick won
  // Get user's team score and opponent score
  const userTeamScore = userChoice === "home" ? homeScore : awayScore;
  const opponentScore = userChoice === "home" ? awayScore : homeScore;

  // Apply the spread the user took to their team's score
  // If user picked MIN -2.5, we add -2.5 to MIN's score
  // If user picked PIT +2.5, we add +2.5 to PIT's score
  const adjustedUserScore = userTeamScore + spreadAtPick;
  const adjustedMargin = adjustedUserScore - opponentScore;

  // Step 3: Determine outcome
  let userWon: boolean;
  let isPush: boolean;

  if (adjustedMargin > 0) {
    userWon = true;
    isPush = false;
  } else if (adjustedMargin < 0) {
    userWon = false;
    isPush = false;
  } else {
    // Exact tie after spread adjustment (very rare with .5 spreads)
    userWon = false;
    isPush = true;
  }

  // Step 4: Calculate home/away covers for legacy compatibility
  // Convert user's spread back to home team perspective
  const homeSpread = userChoice === "away" ? -spreadAtPick : spreadAtPick;
  const adjustedHomeScore = homeScore + homeSpread;
  const homeAdjustedMargin = adjustedHomeScore - awayScore;

  let homeCovers: boolean;
  let awayCovers: boolean;

  if (homeAdjustedMargin > 0) {
    homeCovers = true;
    awayCovers = false;
  } else if (homeAdjustedMargin < 0) {
    homeCovers = false;
    awayCovers = true;
  } else {
    homeCovers = false;
    awayCovers = false;
  }

  // Step 5: Calculate points
  const points = userWon ? 10 : 0;

  // Step 6: Generate human-readable explanation
  const explanation = generateExplanation(
    homeScore,
    awayScore,
    spreadAtPick,
    userChoice,
    actualMargin,
    adjustedMargin,
    userWon,
    isPush
  );

  return {
    userWon,
    homeCovers,
    awayCovers,
    isPush,
    actualMargin,
    adjustedMargin,
    explanation,
    points,
  };
}

/**
 * Generate human-readable explanation of the spread calculation
 */
function generateExplanation(
  homeScore: number,
  awayScore: number,
  spreadAtPick: number,
  userChoice: "home" | "away",
  actualMargin: number,
  adjustedMargin: number,
  userWon: boolean,
  isPush: boolean
): string {
  const marginAbs = Math.abs(actualMargin);
  const spreadAbs = Math.abs(spreadAtPick);
  const userTeam = userChoice === "home" ? "Home" : "Away";
  const userTeamScore = userChoice === "home" ? homeScore : awayScore;
  const opponentScore = userChoice === "home" ? awayScore : homeScore;

  // Game result description
  let gameResult: string;
  if (actualMargin > 0) {
    gameResult = `Home won ${homeScore}-${awayScore} (by ${marginAbs})`;
  } else if (actualMargin < 0) {
    gameResult = `Away won ${awayScore}-${homeScore} (by ${marginAbs})`;
  } else {
    gameResult = `Game tied ${homeScore}-${awayScore}`;
  }

  // User's pick description
  const spreadStr = spreadAtPick > 0 ? `+${spreadAtPick}` : `${spreadAtPick}`;
  let pickDescription: string;

  if (spreadAtPick < 0) {
    // User took favorite
    pickDescription = `You picked ${userTeam} ${spreadStr} (needed to win by more than ${spreadAbs})`;
  } else if (spreadAtPick > 0) {
    // User took underdog
    pickDescription = `You picked ${userTeam} ${spreadStr} (could lose by up to ${spreadAbs})`;
  } else {
    // Pick 'em
    pickDescription = `You picked ${userTeam} (pick 'em, no spread)`;
  }

  // Result with adjusted score
  let resultDescription: string;
  const adjustedScore = userTeamScore + spreadAtPick;

  if (isPush) {
    resultDescription = `With spread: ${adjustedScore.toFixed(
      1
    )}-${opponentScore} (PUSH - exact tie)`;
  } else {
    const winLoss = userWon ? "WIN" : "LOSS";
    resultDescription = `With spread: ${adjustedScore.toFixed(
      1
    )}-${opponentScore} (${winLoss})`;
  }

  return `${gameResult}. ${pickDescription}. ${resultDescription}`;
}

/**
 * Test the spread calculation function with known examples
 */
export function testSpreadCalculation(): void {
  console.log("🧪 Testing Spread Calculation Function\n");

  const testCases = [
    {
      name: "User picks favorite, favorite covers",
      homeScore: 28,
      awayScore: 14,
      spreadAtPick: -7.5, // User picked home team at -7.5
      userChoice: "home" as const,
      expectedUserWon: true, // Home won by 14, needed 7.5+
    },
    {
      name: "User picks favorite, favorite does not cover",
      homeScore: 27, // Jets (home)
      awayScore: 29, // Bucs (away)
      spreadAtPick: -6.5, // User picked Jets -6.5
      userChoice: "home" as const,
      expectedUserWon: false, // Jets lost by 2, needed to win by 6.5+
    },
    {
      name: "User picks underdog, underdog covers by losing less",
      homeScore: 21,
      awayScore: 17,
      spreadAtPick: +7.5, // User picked away team at +7.5
      userChoice: "away" as const,
      expectedUserWon: true, // Away lost by 4, less than 7.5 spread
    },
    {
      name: "User picks underdog, underdog wins outright",
      homeScore: 14,
      awayScore: 21,
      spreadAtPick: +3.5, // User picked away team at +3.5
      userChoice: "away" as const,
      expectedUserWon: true, // Away won outright
    },
    {
      name: "User picks away favorite, covers",
      homeScore: 17,
      awayScore: 31,
      spreadAtPick: -6.5, // User picked away team at -6.5
      userChoice: "away" as const,
      expectedUserWon: true, // Away won by 14, needed 6.5+
    },
    {
      name: "User picks home underdog, does not cover",
      homeScore: 20,
      awayScore: 28,
      spreadAtPick: +3.5, // User picked home team at +3.5
      userChoice: "home" as const,
      expectedUserWon: false, // Home lost by 8, more than 3.5
    },
    {
      name: "Push scenario (rare with .5 spreads)",
      homeScore: 24,
      awayScore: 17,
      spreadAtPick: -7.0, // User picked home at -7.0 (no .5)
      userChoice: "home" as const,
      expectedUserWon: false, // Won by exactly 7, push
    },
  ];

  testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`  Home: ${test.homeScore}, Away: ${test.awayScore}`);
    console.log(`  User picked: ${test.userChoice} at ${test.spreadAtPick}`);

    try {
      const result = calculateSpreadResult(
        test.homeScore,
        test.awayScore,
        test.spreadAtPick,
        test.userChoice
      );

      const resultStr = result.isPush
        ? "PUSH"
        : result.userWon
        ? "WIN"
        : "LOSS";
      const expectedStr = test.expectedUserWon ? "WIN" : "LOSS";
      const passed = result.userWon === test.expectedUserWon;

      console.log(`  Result: ${resultStr} (${result.points} pts)`);
      console.log(`  Expected: ${expectedStr}`);
      console.log(`  ${passed ? "✅ CORRECT" : "❌ WRONG"}`);
      console.log(`  ${result.explanation}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }

    console.log("");
  });
}
