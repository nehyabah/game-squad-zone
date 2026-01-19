# Six Nations Scoring System

## Overview

The Six Nations scoring system is **simple and straightforward** - no penalties, no losses, just points for correct answers.

---

## Scoring Rules

### ✅ **Correct Answer**
- User gets the **points assigned to that question**
- Typically 1 point per question (admin can configure)
- Points are added to the user's total

### ❌ **Wrong Answer**
- User gets **0 points** for that question
- No penalties applied
- Does not affect other questions

### 🚫 **No Answer (Missed Pick)**
- User gets **0 points** for that question
- No penalties applied
- User simply doesn't score for questions they didn't answer

---

## Key Differences from NFL Scoring

| Feature | Six Nations | NFL |
|---------|-------------|-----|
| **Correct Pick** | + Points | + Points |
| **Wrong Pick** | 0 points | 0 points (loss recorded) |
| **Missed Pick** | 0 points | Penalty loss (recorded as loss) |
| **Tracking** | Only correct answers | Wins, losses, pushes tracked |
| **Win %** | Not used | Used for ranking |
| **Ranking** | Total points only | Win % primary, points secondary |

---

## Leaderboard Calculation

### How Points Are Calculated

```typescript
// Only look at CORRECT answers
const correctAnswers = answers.where(isCorrect === true);

// Sum up points from correct answers
for (const answer of correctAnswers) {
  totalPoints += answer.question.points;
  correctAnswers += 1;
}
```

**Result:**
- Users are ranked by **total points** (descending)
- If player A has 12 correct answers = 12 points
- If player B has 8 correct answers = 8 points
- If player C didn't answer any = 0 points

### Leaderboard Example

```
┌──────┬────────┬────────┬──────────────────┐
│ Rank │ Player │ Points │ Correct Answers  │
├──────┼────────┼────────┼──────────────────┤
│  1   │ Alice  │   15   │ 15 correct       │
│  2   │ Bob    │   12   │ 12 correct       │
│  3   │ Carol  │    8   │  8 correct       │
│  4   │ Dave   │    0   │  0 correct       │ ← Didn't answer or all wrong
└──────┴────────┴────────┴──────────────────┘
```

---

## What Gets Tracked?

### ✅ **Tracked:**
- Total points earned
- Number of correct answers
- Which questions were answered correctly

### ❌ **NOT Tracked:**
- Win percentage
- Number of wrong answers
- Number of missed picks
- Losses or penalties

---

## Answer System

### Initial Submission
- User answers questions for the round
- Clicks **"Submit"** button
- Answers are saved to database
- User sees success message with confetti 🎉

### Updating Answers
- User can change their answers before matches lock
- Clicks **"Update"** button (button text changes after first submission)
- Updated answers replace previous answers
- No confetti on updates (only on first submission)
- Simple success toast notification

### Locking
- Questions lock **1 hour before match kickoff**
- After locking, user **cannot** change answers for that match
- Prevents last-minute changes based on lineup info

---

## Scoring Workflow

### 1. User Answers Questions
```
User answers 15 questions across 3 matches
→ All answers saved with isCorrect: null
```

### 2. Matches Complete
```
Admin sets correct answers for each question
→ System calculates isCorrect for all user answers
```

### 3. Points Awarded
```
Question 1: User correct → +1 point
Question 2: User wrong   → +0 points
Question 3: User correct → +1 point
Question 4: No answer    → +0 points
...
Total: 12 points
```

### 4. Leaderboard Updates
```
Leaderboard ranks users by total points
User with most correct answers = #1
```

---

## Admin Controls

### Setting Correct Answers
1. Go to Admin Panel → Six Nations
2. Navigate to Questions Manager
3. For each question, click "Set Answer"
4. Enter the correct answer
5. System automatically:
   - Calculates isCorrect for all user answers
   - Updates leaderboard scores

### Question Points
- Default: 1 point per question
- Admin can set custom points per question
- Higher stakes questions can be worth more points

---

## Example Scenario

### Round 1 Setup
```
Match 1: Ireland vs France (5 questions, 1 point each)
Match 2: England vs Wales (5 questions, 1 point each)
Match 3: Scotland vs Italy (5 questions, 1 point each)
Total: 15 questions, 15 points possible
```

### Player Performance

**Alice (12 points):**
- Answered all 15 questions
- Got 12 correct, 3 wrong
- Score: 12 points

**Bob (8 points):**
- Answered 10 questions
- Got 8 correct, 2 wrong
- Missed 5 questions
- Score: 8 points (0 penalty for missed picks)

**Carol (0 points):**
- Forgot to submit picks
- Answered 0 questions
- Score: 0 points (no penalty, just no points)

### Leaderboard
```
1. Alice - 12 points (12/15 correct)
2. Bob - 8 points (8/10 correct, 5 missed)
3. Carol - 0 points (0 answers)
```

---

## Database Schema

```typescript
model SixNationsAnswer {
  id         String   @id
  questionId String
  userId     String
  answer     String   // User's selected answer
  isCorrect  Boolean? // null until correct answer is set

  // No "status" field (no won/lost/pushed)
  // No "penalty" field
  // No "loss" tracking
}
```

**Simple Fields:**
- `answer`: What the user picked
- `isCorrect`: Was it right? (calculated after match)

**That's it!** No complex status tracking.

---

## Code Implementation

### Leaderboard Query
```typescript
// Get all CORRECT answers only
const correctAnswers = await prisma.sixNationsAnswer.findMany({
  where: {
    isCorrect: true,  // ⭐ Only correct answers count
    question: {
      match: {
        round: { isActive: true }
      }
    }
  }
});

// Sum up points
for (const answer of correctAnswers) {
  totalPoints += answer.question.points;  // Add points
  // ⭐ No subtraction for wrong/missing answers
}
```

### Key Points
- ✅ Only queries where `isCorrect: true`
- ✅ No negative points
- ✅ No penalty for missing answers
- ✅ Simple addition only

---

## User Interface Changes

### Submit/Update Button

**First Time:**
```
[Submit] ← User sees this initially
```

**After Submitting:**
```
[Update] ← Button changes to "Update"
```

**Button States:**
- **Submit**: First submission (shows confetti)
- **Update**: Subsequent changes (no confetti, just toast)
- **Disabled**: When not all questions answered or submitting

### Toast Messages

**First Submission:**
```
✅ Submissions Received
Successfully recorded 15 prediction(s). Good luck!
```

**Updates:**
```
✅ Answers Updated
Successfully updated 15 prediction(s).
```

---

## Summary

🎯 **Six Nations Scoring = Simple Addition**

- Correct answer → **Add points**
- Wrong answer → **Add 0 points**
- No answer → **Add 0 points**
- **No penalties**
- **No losses**
- **No win percentage**

Just pure, simple scoring based on correct predictions! 🏉
