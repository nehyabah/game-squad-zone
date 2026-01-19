# Week 10 Premature Scoring Investigation Report

**Date:** November 7, 2025
**Status:** Resolved & Root Cause Identified

## Issue Summary

Week 10 (2025-W10) games were incorrectly scored before they were played:
- 13 of 14 games had scores populated and were marked as completed
- 18 of 21 user picks were scored as won/lost
- All games had future dates (November 9-11, 2025)

## Actions Taken

✅ **Cleared all incorrect data:**
- Reset all 13 game scores to NULL
- Set all games to `completed: false`
- Reset 18 picks from won/lost back to `pending`
- No wallet transactions were created

## Root Cause Analysis

### PRIMARY CAUSE: The Odds API Data Issue

**The Odds API `/scores` endpoint temporarily returned future games as "completed" with scores**

**Evidence:**
1. All game IDs are legitimate 2025 Week 10 games (verified against current API)
2. Game matchups, dates, and teams are all correct for 2025 Week 10
3. The Odds API is **currently** returning correct data (only past games completed)
4. The scores that were populated looked like realistic NFL game scores

**Timeline:**
- **Friday, Nov 7, 04:40 UTC**: Week 10 spreads cached correctly
- **Unknown time on Nov 7**: The Odds API returned bad data
- **Unknown time on Nov 7**: Auto-scoring service fetched and applied this data
- **Today**: The Odds API has corrected itself

### CONTRIBUTING CAUSE: Missing Date Validation

**File:** `backend/src/services/auto-scoring.service.ts` (Lines 142-190)

The `updateGameResult()` method accepts scores from the API without validating that:
1. The game date has passed
2. The game is actually in the past before marking it completed

```typescript
// Current code (line 169-178):
await this.prisma.game.update({
  where: { id: existingGame.id },
  data: {
    homeScore: parseInt(homeScore),
    awayScore: parseInt(awayScore),
    completed: true  // ❌ No date validation!
  }
});
```

## What We Ruled Out

❌ **Admin endpoint abuse** - Admin routes exist but are NOT registered/exposed
❌ **Random data generation** - No code generates random scores in production
❌ **2024 historical data mix-up** - Game IDs match current 2025 API
❌ **Simulator interference** - Simulator uses separate in-memory database
❌ **Other weeks affected** - Only Week 10 had this issue

## Impact Assessment

### Affected Data
- **Games:** 13 games in 2025-W10
- **Picks:** 18 picks from 6 users
- **Users Affected:**
  - Nehemiah
  - Alan O'Connor
  - Eoghan_Doyle
  - Sam Green
  - Terence
  - Jembo

### NOT Affected
- ✅ Weeks 1-9: All legitimate scores
- ✅ Week 11: No scores yet
- ✅ Wallet balances: No transactions created
- ✅ Squad pots: No payouts made

## Recommended Fixes

### 1. Add Date Validation (HIGH PRIORITY)
Prevent future games from being scored:

```typescript
// In updateGameResult() method
const gameDate = new Date(apiGame.commence_time);
const now = new Date();

if (gameDate > now) {
  console.log(`⚠️ REJECTED: Game ${gameId} is in the future (${gameDate})`);
  return; // Don't update future games
}
```

### 2. Add Monitoring (MEDIUM PRIORITY)
Alert when suspicious data is detected:
- Future games getting scored
- Games scored without proper time elapsed
- API returning unexpected data patterns

### 3. Add Audit Logging (MEDIUM PRIORITY)
Track when scores are updated:
- What time
- What source (API vs manual)
- What scores were added

### 4. API Response Validation (LOW PRIORITY)
Add sanity checks for API responses:
- Validate score ranges (0-100 for NFL)
- Check for duplicate game IDs
- Verify team names match expected format

## Vulnerability Notes

### Admin Routes Security
The file `backend/src/modules/admin/admin.routes.ts` defines potentially dangerous endpoints:
- `/admin/simulate-game-completion` - Can inject fake scores
- `/admin/score-completed-games` - Can trigger scoring manually

**Current Status:** ✅ SAFE - These routes are defined but NOT registered in app.ts
**Recommendation:** Either properly secure them with admin auth OR delete the file entirely

## Prevention Checklist

- [ ] Add date validation to `updateGameResult()`
- [ ] Add date validation to `autoCompletePastWeekGames()`
- [ ] Test with mock API responses
- [ ] Set up monitoring alerts
- [ ] Consider implementing circuit breaker for API failures
- [ ] Document the auto-scoring process
- [ ] Add admin auth if admin routes are ever exposed

## Conclusion

This was a **temporary API data issue** combined with **missing validation** in the auto-scoring service. The Odds API briefly returned incorrect data, and our system trusted it without validating game dates. The issue is now resolved, but we need to add protections to prevent this from happening again.

---
**Report Generated:** November 7, 2025
**Investigation By:** Claude Code
