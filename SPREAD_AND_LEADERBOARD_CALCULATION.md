# Spread Calculation & Leaderboard System

## Table of Contents
1. [Spread Calculation Overview](#spread-calculation-overview)
2. [How Spreads Work](#how-spreads-work)
3. [Win/Loss/Push Determination](#winlosspush-determination)
4. [Points Calculation](#points-calculation)
5. [Leaderboard Ranking System](#leaderboard-ranking-system)
6. [Examples](#examples)

---

## Spread Calculation Overview

The system uses **point spread betting** to determine if a user's pick wins or loses. The spread calculation is handled by `spreadCalculator.ts` and called by the `ScoringService`.

### Key Files:
- **`src/utils/spreadCalculator.ts`** - Core spread calculation logic
- **`src/modules/scoring/scoring.service.ts`** - Scoring and points assignment
- **`src/modules/leaderboards/leaderboards.repo.ts`** - Leaderboard ranking logic

---

## How Spreads Work

### Basic Concept
A spread gives the underdog team virtual points and takes points away from the favorite. The user wins if their chosen team "covers the spread."

### Formula
```
Adjusted Score = Team Score + Spread At Pick
User Wins if: Adjusted Score > Opponent Score
```

### Example
If you pick **Pittsburgh +2.5**:
- Pittsburgh's final score gets +2.5 added
- If the adjusted score beats the opponent, you win

If you pick **Minnesota -7.5**:
- Minnesota's final score gets -7.5 added
- Minnesota must win by MORE than 7.5 points for you to win

---

## Win/Loss/Push Determination

The system calculates the result in 4 steps:

### Step 1: Calculate Actual Game Margin
```typescript
actualMargin = homeScore - awayScore
// Positive = home won, Negative = away won
```

### Step 2: Determine User's Team Scores
```typescript
userTeamScore = userChoice === "home" ? homeScore : awayScore
opponentScore = userChoice === "home" ? awayScore : homeScore
```

### Step 3: Apply the Spread
```typescript
adjustedUserScore = userTeamScore + spreadAtPick
adjustedMargin = adjustedUserScore - opponentScore
```

### Step 4: Determine Outcome
```typescript
if (adjustedMargin > 0) {
  userWon = true
  isPush = false
} else if (adjustedMargin < 0) {
  userWon = false
  isPush = false
} else {
  // Exact tie after spread adjustment
  userWon = false
  isPush = true
}
```

### Push Scenario
A **push** occurs when the adjusted score equals the opponent's score exactly. This is rare with `.5` spreads but can happen with whole number spreads.

Example: Pick home team at -7.0, home wins by exactly 7 → PUSH (no win, no loss)

---

## Points Calculation

### Winning Picks
- **Base Points**: 10 points per win
- **Push**: 0 points (bet is returned)
- **Loss**: 0 points

### Payout Calculation (If Odds Are Provided)
```typescript
if (odds > 0) {
  // Positive odds: +150 means win $150 on $100 bet
  payout = basePoints * (1 + odds / 100)
} else {
  // Negative odds: -150 means bet $150 to win $100
  payout = basePoints * (1 + 100 / Math.abs(odds))
}
```

### Pick Status Updates
After a game completes, each pick is updated with:
- **status**: `"won"`, `"lost"`, or `"pushed"`
- **result**: String format like `"won:10"`, `"lost:0"`, `"push:0"`
- **payout**: Calculated based on odds (if provided)

---

## Leaderboard Ranking System

The leaderboard uses a **two-tier ranking system** that prioritizes consistency over raw points.

### Primary Ranking Metric: Win Percentage
```typescript
// Formula: (wins + pushes/2) / total_games
const totalGames = wins + losses + pushes
const winPercentage = totalGames > 0
  ? ((wins + (pushes / 2)) / totalGames) * 100
  : 0
```

**Key Points:**
- Pushes count as **0.5 wins** (50% value)
- This rewards consistent picking over volume
- Win percentage is rounded to 2 decimal places

### Secondary Ranking Metric: Total Points
If two users have the same win percentage, total points acts as the tie-breaker.

### Sorting Logic
```typescript
entries.sort((a, b) => {
  // First: Sort by win percentage (descending)
  if (b.winPercentage !== a.winPercentage) {
    return b.winPercentage - a.winPercentage
  }
  // Tie-breaker: Sort by total points (descending)
  return b.points - a.points
})
```

### Leaderboard Types

#### 1. Weekly Leaderboard
- **Points**: Sum of points from picks in that week only
- **Win %**: Based on **all-time season stats** (not just that week)
- **Purpose**: Shows who scored most points this week, ranked by overall consistency

#### 2. Season Leaderboard
- **Points**: Sum of all points earned across all weeks
- **Win %**: Based on all picks ever made
- **Purpose**: Shows overall season leaders

#### 3. Squad Leaderboard
Can be filtered by week or show season totals:
- **Weekly**: Points from that week, ranked by overall season win %
- **Season**: All-time points and stats for squad members
- **Sport Filter**: Automatically filters by squad's sport (NFL/Six Nations)

---

## Examples

### Example 1: User Picks Favorite (Covers)
```
Game Result: Home 28 - Away 14 (Home won by 14)
User Pick: Home team at -7.5

Calculation:
- adjustedHomeScore = 28 + (-7.5) = 20.5
- adjustedMargin = 20.5 - 14 = 6.5
- Result: User WINS (adjusted margin > 0)
- Points: 10
```

**Explanation**: Home needed to win by more than 7.5. They won by 14, so they covered.

---

### Example 2: User Picks Favorite (Doesn't Cover)
```
Game Result: Home 27 - Away 29 (Away won by 2)
User Pick: Home team at -6.5

Calculation:
- adjustedHomeScore = 27 + (-6.5) = 20.5
- adjustedMargin = 20.5 - 29 = -8.5
- Result: User LOSES (adjusted margin < 0)
- Points: 0
```

**Explanation**: Home needed to win by more than 6.5 but lost by 2. Did not cover.

---

### Example 3: User Picks Underdog (Covers by Losing Less)
```
Game Result: Home 21 - Away 17 (Home won by 4)
User Pick: Away team at +7.5

Calculation:
- adjustedAwayScore = 17 + 7.5 = 24.5
- adjustedMargin = 24.5 - 21 = 3.5
- Result: User WINS (adjusted margin > 0)
- Points: 10
```

**Explanation**: Away team lost by 4, but with +7.5 spread they "covered" because 4 < 7.5.

---

### Example 4: Underdog Wins Outright
```
Game Result: Home 14 - Away 21 (Away won by 7)
User Pick: Away team at +3.5

Calculation:
- adjustedAwayScore = 21 + 3.5 = 24.5
- adjustedMargin = 24.5 - 14 = 10.5
- Result: User WINS (adjusted margin > 0)
- Points: 10
```

**Explanation**: When an underdog wins outright, they always cover the spread.

---

### Example 5: Push Scenario
```
Game Result: Home 24 - Away 17 (Home won by 7)
User Pick: Home team at -7.0

Calculation:
- adjustedHomeScore = 24 + (-7.0) = 17.0
- adjustedMargin = 17.0 - 17 = 0
- Result: PUSH (adjusted margin = 0)
- Points: 0
```

**Explanation**: Exact tie after spread adjustment. No win, no loss.

---

## Leaderboard Calculation Examples

### Example: 3 Users Competing

| User  | Wins | Losses | Pushes | Total Games | Win % Calculation | Win % | Points | Rank |
|-------|------|--------|--------|-------------|-------------------|-------|--------|------|
| Alice | 8    | 2      | 0      | 10          | (8 + 0/2) / 10    | 80.00%| 80     | 1    |
| Bob   | 7    | 2      | 1      | 10          | (7 + 1/2) / 10    | 75.00%| 70     | 2    |
| Carol | 6    | 3      | 1      | 10          | (6 + 1/2) / 10    | 65.00%| 60     | 3    |

**Alice** has the highest win percentage (80%), so she ranks #1 despite having the same number of total games as the others.

### Example: Tie-Breaking by Points

| User  | Wins | Losses | Pushes | Win % | Points | Rank |
|-------|------|--------|--------|-------|--------|------|
| Dave  | 7    | 3      | 0      | 70.00%| 80     | 1    |
| Emma  | 7    | 3      | 0      | 70.00%| 70     | 2    |

Both have the same win percentage, so **Dave** ranks higher due to more total points (secondary tie-breaker).

---

## Key Implementation Details

### When Picks Are Scored
1. **Auto-Scoring Service** runs every 30 minutes
2. Checks for completed games with unscored picks
3. Calls `ScoringService.calculatePickResult()` for each pick
4. Updates pick status, result, and payout in database

### Data Flow
```
Game Completes (completed = true, scores set)
    ↓
Auto-Scoring Service detects completion
    ↓
ScoringService.calculatePickResult(pickId)
    ↓
spreadCalculator.calculateSpreadResult()
    ↓
Pick updated with status/result/payout
    ↓
Leaderboard queries reflect new stats
```

### Database Updates
When a pick is scored:
```typescript
await prisma.pick.update({
  where: { id: pickId },
  data: {
    status: "won" | "lost" | "pushed",
    result: "won:10" | "lost:0" | "push:0",
    payout: calculatedPayout
  }
})
```

### Real-Time Leaderboard Updates
Leaderboards are **calculated on-demand** (not cached):
- Weekly leaderboard: Queries picks for specific week
- Season leaderboard: Aggregates all picks across all weeks
- Squad leaderboard: Filters to squad members only
- Rankings update immediately when picks are scored

---

## Summary

### Spread Calculation
1. Take user's team score
2. Add the spread they picked
3. Compare adjusted score to opponent
4. User wins if adjusted score > opponent score

### Leaderboard Ranking
1. **Primary**: Win percentage (wins + pushes/2) / total_games
2. **Secondary**: Total points as tie-breaker
3. **Ranking**: Descending order by win %, then points

This system rewards **consistency and skill** in picking winners while still considering volume and points as a secondary factor.
