# Validation Strategies for Auto-Scoring System

## 1. Date/Time Validations (CRITICAL - Must Implement)

### A. Future Game Protection
**Purpose:** Prevent future games from being scored
**Location:** `auto-scoring.service.ts` - `updateGameResult()` method

```typescript
const gameDate = new Date(apiGame.commence_time);
const now = new Date();

// Game must have started
if (gameDate > now) {
  console.error(`❌ REJECTED: Game in future - ${apiGame.away_team} @ ${apiGame.home_team}`);
  console.error(`   Game time: ${gameDate}, Current time: ${now}`);
  return;
}
```

### B. Minimum Time Elapsed
**Purpose:** NFL games take ~3-4 hours, don't accept scores too early
**Why:** If a game started 30 minutes ago, it can't be completed yet

```typescript
const gameStartTime = new Date(apiGame.commence_time);
const now = new Date();
const hoursElapsed = (now.getTime() - gameStartTime.getTime()) / (1000 * 60 * 60);

const MIN_GAME_DURATION_HOURS = 2.5; // NFL games are rarely shorter

if (hoursElapsed < MIN_GAME_DURATION_HOURS) {
  console.warn(`⚠️ SUSPICIOUS: Game completed too quickly (${hoursElapsed.toFixed(1)}h)`);
  console.warn(`   ${apiGame.away_team} @ ${apiGame.home_team}`);
  // Either reject or flag for manual review
  return;
}
```

### C. Maximum Time Window
**Purpose:** Don't accept scores for games too far in the past
**Why:** If we're getting scores from a month ago, something is wrong

```typescript
const MAX_DAYS_OLD = 7; // Only accept scores from last week

if (hoursElapsed > (MAX_DAYS_OLD * 24)) {
  console.warn(`⚠️ SUSPICIOUS: Game too old (${Math.floor(hoursElapsed / 24)} days)`);
  return;
}
```

## 2. Score Validation (HIGH PRIORITY)

### A. Score Reasonability
**Purpose:** NFL scores follow certain patterns
**Why:** Catch obviously fake data

```typescript
// Validate scores are in reasonable range
const MIN_SCORE = 0;
const MAX_SCORE = 100; // Highest NFL score ever was 73

if (homeScore < MIN_SCORE || homeScore > MAX_SCORE ||
    awayScore < MIN_SCORE || awayScore > MAX_SCORE) {
  console.error(`❌ INVALID SCORES: ${awayScore}-${homeScore}`);
  return;
}

// Check for suspiciously high scoring
const SUSPICIOUS_TOTAL = 100; // Combined score > 100 is very rare
if ((homeScore + awayScore) > SUSPICIOUS_TOTAL) {
  console.warn(`⚠️ SUSPICIOUS: Very high scoring game ${awayScore}-${homeScore}`);
  // Log but don't necessarily reject
}
```

### B. Score Type Validation
**Purpose:** Ensure scores are integers, not null/undefined/strings

```typescript
if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
  console.error(`❌ INVALID: Scores must be integers`);
  return;
}

if (homeScore === null || awayScore === null ||
    homeScore === undefined || awayScore === undefined) {
  console.error(`❌ INVALID: Missing scores`);
  return;
}
```

## 3. API Response Validation (HIGH PRIORITY)

### A. Response Structure Validation
**Purpose:** Ensure API returns expected format

```typescript
function validateAPIResponse(apiGame: any): boolean {
  // Required fields
  if (!apiGame.id || !apiGame.home_team || !apiGame.away_team ||
      !apiGame.commence_time) {
    console.error(`❌ INVALID API RESPONSE: Missing required fields`);
    return false;
  }

  // Validate completed flag matches scores
  if (apiGame.completed && (!apiGame.scores || apiGame.scores.length === 0)) {
    console.error(`❌ INVALID: Game marked completed but no scores`);
    return false;
  }

  // Validate scores array structure
  if (apiGame.scores) {
    const hasHomeScore = apiGame.scores.some(s => s.name === apiGame.home_team);
    const hasAwayScore = apiGame.scores.some(s => s.name === apiGame.away_team);

    if (!hasHomeScore || !hasAwayScore) {
      console.error(`❌ INVALID: Missing home or away score in scores array`);
      return false;
    }
  }

  return true;
}
```

### B. Team Name Consistency
**Purpose:** Ensure team names match between API and database

```typescript
function validateTeamNames(apiGame: any, dbGame: any): boolean {
  // Exact match
  if (apiGame.home_team === dbGame.homeTeam &&
      apiGame.away_team === dbGame.awayTeam) {
    return true;
  }

  // Partial match (last word - team name)
  const apiHomeLast = apiGame.home_team.split(' ').pop();
  const apiAwayLast = apiGame.away_team.split(' ').pop();
  const dbHomeLast = dbGame.homeTeam.split(' ').pop();
  const dbAwayLast = dbGame.awayTeam.split(' ').pop();

  if (apiHomeLast === dbHomeLast && apiAwayLast === dbAwayLast) {
    return true;
  }

  console.error(`❌ TEAM MISMATCH:`);
  console.error(`   API: ${apiGame.away_team} @ ${apiGame.home_team}`);
  console.error(`   DB:  ${dbGame.awayTeam} @ ${dbGame.homeTeam}`);
  return false;
}
```

## 4. Database State Validation (MEDIUM PRIORITY)

### A. Prevent Overwriting Existing Scores
**Purpose:** Don't overwrite scores that are already set

```typescript
// Before updating
if (existingGame.completed && existingGame.homeScore !== null) {
  // Game already has scores
  const existingHomeScore = existingGame.homeScore;
  const existingAwayScore = existingGame.awayScore;

  // If scores match, it's a duplicate update (OK)
  if (existingHomeScore === homeScore && existingAwayScore === awayScore) {
    console.log(`ℹ️ Duplicate update, scores already set correctly`);
    return;
  }

  // If scores DON'T match, this is suspicious
  console.error(`❌ SCORE CONFLICT:`);
  console.error(`   Existing: ${existingAwayScore}-${existingHomeScore}`);
  console.error(`   New:      ${awayScore}-${homeScore}`);

  // Don't overwrite - require manual intervention
  return;
}
```

### B. Week Consistency Check
**Purpose:** Ensure game is in the expected week

```typescript
import { getWeekIdFromDate } from '../utils/weekUtils';

const apiGameWeek = getWeekIdFromDate(new Date(apiGame.commence_time));
const dbGameWeek = existingGame.weekId;

if (apiGameWeek !== dbGameWeek) {
  console.error(`❌ WEEK MISMATCH: API says ${apiGameWeek}, DB says ${dbGameWeek}`);
  return;
}
```

## 5. Rate Limiting & Circuit Breaker (MEDIUM PRIORITY)

### A. Circuit Breaker Pattern
**Purpose:** Stop using API if it's returning bad data

```typescript
class APICircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  private readonly MAX_FAILURES = 3;
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  recordSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.MAX_FAILURES) {
      this.state = 'OPEN';
      console.error(`🚨 CIRCUIT BREAKER OPEN - API failures: ${this.failureCount}`);
    }
  }

  canMakeRequest(): boolean {
    if (this.state === 'CLOSED') return true;

    if (this.state === 'OPEN' && this.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();

      if (timeSinceFailure > this.TIMEOUT_MS) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker HALF_OPEN - retrying API`);
        return true;
      }
    }

    return false;
  }
}
```

### B. Validation Failure Tracking
**Purpose:** If we reject multiple games in a row, stop processing

```typescript
let consecutiveRejections = 0;
const MAX_CONSECUTIVE_REJECTIONS = 5;

// In processCompletedGames loop:
if (validationFailed) {
  consecutiveRejections++;

  if (consecutiveRejections >= MAX_CONSECUTIVE_REJECTIONS) {
    console.error(`🚨 STOPPING: ${consecutiveRejections} consecutive rejections`);
    console.error(`   API may be returning bad data - manual review required`);
    break; // Stop processing
  }
} else {
  consecutiveRejections = 0; // Reset on success
}
```

## 6. Audit Logging (MEDIUM PRIORITY)

### A. Score Update Audit Log
**Purpose:** Track all score updates for investigation

```typescript
// Create audit log table (Prisma schema addition)
model ScoreUpdateAudit {
  id          String   @id @default(cuid())
  gameId      String
  source      String   // "odds-api", "manual", etc.
  homeScore   Int
  awayScore   Int
  completed   Boolean
  apiResponse Json?    // Store full API response
  createdAt   DateTime @default(now())

  @@index([gameId])
  @@index([createdAt])
}

// Log every score update
await prisma.scoreUpdateAudit.create({
  data: {
    gameId: existingGame.id,
    source: 'odds-api',
    homeScore: homeScore,
    awayScore: awayScore,
    completed: true,
    apiResponse: apiGame, // Store full API response
  }
});
```

### B. Validation Failure Log
**Purpose:** Track rejected updates to identify patterns

```typescript
model ValidationFailureLog {
  id        String   @id @default(cuid())
  gameId    String?
  reason    String
  apiData   Json?
  createdAt DateTime @default(now())

  @@index([reason])
  @@index([createdAt])
}

// Log validation failures
if (gameDate > now) {
  await prisma.validationFailureLog.create({
    data: {
      gameId: apiGame.id,
      reason: 'FUTURE_GAME',
      apiData: apiGame,
    }
  });
}
```

## 7. Monitoring & Alerts (LOW PRIORITY)

### A. Anomaly Detection
**Purpose:** Alert when unusual patterns detected

```typescript
// Monitor in real-time
async function detectAnomalies() {
  // Check for future games with scores
  const futureScored = await prisma.game.count({
    where: {
      startAtUtc: { gt: new Date() },
      completed: true
    }
  });

  if (futureScored > 0) {
    await sendAlert(`🚨 ALERT: ${futureScored} future games have scores!`);
  }

  // Check for suspiciously rapid completions
  const recentlyCompleted = await prisma.game.findMany({
    where: {
      completed: true,
      // Games completed in last 2 hours
      startAtUtc: {
        gte: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    }
  });

  if (recentlyCompleted.length > 5) {
    await sendAlert(`⚠️ WARNING: ${recentlyCompleted.length} games completed in last 2 hours`);
  }
}
```

### B. Daily Summary Report
**Purpose:** Regular health check of scoring system

```typescript
async function generateDailyReport() {
  const stats = {
    gamesScored: 0,
    validationFailures: 0,
    apiErrors: 0,
    manualInterventions: 0,
  };

  // Generate and send report
  console.log(`📊 Daily Auto-Scoring Report:`);
  console.log(`   Games scored: ${stats.gamesScored}`);
  console.log(`   Validation failures: ${stats.validationFailures}`);
  console.log(`   API errors: ${stats.apiErrors}`);
}
```

## Implementation Priority

### MUST IMPLEMENT (Do Now):
1. ✅ Date validation - prevent future games
2. ✅ Minimum time elapsed check
3. ✅ Score reasonability checks
4. ✅ API response structure validation

### SHOULD IMPLEMENT (Next Sprint):
5. Team name consistency validation
6. Prevent overwriting existing scores
7. Circuit breaker pattern
8. Basic audit logging

### NICE TO HAVE (Future):
9. Anomaly detection monitoring
10. Daily summary reports
11. Advanced analytics on API reliability

## Testing Strategy

```typescript
// Create comprehensive test suite
describe('Auto-Scoring Validation', () => {
  it('should reject future games', () => {
    // Test with game 1 day in future
  });

  it('should reject games completed too quickly', () => {
    // Test with game started 30 mins ago
  });

  it('should reject invalid scores', () => {
    // Test with negative scores, > 100, etc.
  });

  it('should reject mismatched team names', () => {
    // Test with wrong teams
  });

  it('should activate circuit breaker after failures', () => {
    // Test with multiple validation failures
  });
});
```

## Configuration

Add these to your `.env`:
```
# Scoring validation settings
MIN_GAME_DURATION_HOURS=2.5
MAX_SCORE=100
MAX_DAYS_OLD=7
MAX_CONSECUTIVE_REJECTIONS=5
CIRCUIT_BREAKER_MAX_FAILURES=3
CIRCUIT_BREAKER_TIMEOUT_MS=300000
```
