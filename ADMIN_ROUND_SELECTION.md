# Admin Round Selection Feature

## Overview

Admins can now control which Six Nations round is displayed to users. When an admin sets a round as "active," only that round's matches and questions will be visible to all users.

---

## How It Works

### 1. **Database Schema**

The `SixNationsRound` table has an `isActive` boolean field:

```prisma
model SixNationsRound {
  id          String             @id @default(uuid())
  roundNumber Int                @unique // 1-5
  name        String // e.g., "Round 1", "Round 2"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean            @default(false) // ⭐ Only one round can be active at a time
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  matches     SixNationsMatch[]

  @@index([roundNumber])
  @@index([isActive])
}
```

**Key Points:**
- Only **one round** can be active at a time
- When a round is activated, all other rounds are automatically deactivated

---

## 2. **Backend Filtering**

All Six Nations API endpoints automatically filter by the active round:

### **GET /api/six-nations/matches**
```typescript
// Only returns matches from the active round
async getAllMatches() {
  return this.prisma.sixNationsMatch.findMany({
    where: {
      round: {
        isActive: true  // ⭐ Only active round
      }
    },
    // ... includes and ordering
  });
}
```

### **GET /api/six-nations/questions**
```typescript
// Only returns questions from matches in the active round
async getAllQuestions() {
  return this.prisma.sixNationsQuestion.findMany({
    where: {
      match: {
        round: {
          isActive: true  // ⭐ Only active round
        }
      }
    },
    // ... includes and ordering
  });
}
```

### **GET /api/six-nations/answers**
```typescript
// Only returns user answers from the active round (unless specific roundId provided)
async getUserAnswers(userId: string, roundId?: string) {
  const where: any = { userId };

  if (!roundId) {
    // Default to active round
    where.question = {
      match: {
        round: {
          isActive: true  // ⭐ Only active round
        }
      }
    };
  }
  // ...
}
```

### **GET /api/six-nations/leaderboard**
```typescript
// Only returns scores from the active round (unless specific roundId provided)
async getLeaderboard(roundId?: string) {
  const where: any = { isCorrect: true };

  if (!roundId) {
    // Default to active round
    where.question = {
      match: {
        round: {
          isActive: true  // ⭐ Only active round
        }
      }
    };
  }
  // ...
}
```

**Result:** Users only see data from the active round without any frontend filtering needed!

---

## 3. **Admin Controls**

### **Activating a Round**

**API Endpoint:**
```
PATCH /api/six-nations/rounds/:id/activate
```

**Backend Logic:**
```typescript
async activateRound(id: string) {
  // 1. Deactivate all other rounds
  await this.prisma.sixNationsRound.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // 2. Activate the specified round
  return this.prisma.sixNationsRound.update({
    where: { id },
    data: { isActive: true },
  });
}
```

**Process:**
1. All rounds are first set to `isActive: false`
2. The selected round is set to `isActive: true`
3. This ensures only one round is ever active

---

## 4. **Admin UI**

### **Location**
- **Page:** Admin Panel → Six Nations Manager
- **Component:** `src/components/admin/RoundsManager.tsx`

### **Features**

#### **Visual Indicators:**
- Active round has a **green border**
- "Active" badge displayed on the current round
- Clear visual distinction between active and inactive rounds

#### **Actions:**
- **Activate Button:** Click to make a round active
  - Only shows on **non-active** rounds
  - One-click activation
  - Instant feedback via toast notifications

#### **Example UI:**

```
┌─────────────────────────────────────┐
│ Round 1                         🗑️  │  ← Inactive
│ Round 1 • Jan 1 - Feb 15            │
│                [Activate]            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Round 2  [Active]               🗑️  │  ← Active (green border)
│ Round 2 • Feb 16 - Mar 15            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Round 3                         🗑️  │  ← Inactive
│ Round 3 • Mar 16 - Apr 15            │
│                [Activate]            │
└─────────────────────────────────────┘
```

---

## 5. **User Experience**

### **What Users See:**

When an admin activates a round, users will see:

✅ **Only matches from the active round**
- Example: If Round 2 is active, only Round 2's 3 matches appear

✅ **Only questions from the active round**
- Users can only answer questions for active round matches

✅ **Only their answers from the active round**
- Previous rounds' answers are hidden (but preserved in database)

✅ **Leaderboard for the active round only**
- Scores are calculated based on the active round only

### **When Admin Changes Round:**

1. Admin clicks "Activate" on Round 3
2. Backend deactivates Round 2, activates Round 3
3. Users refresh their page
4. Now they see only Round 3 matches and questions

**Note:** Users don't lose their previous answers - they're just hidden. If admin switches back to Round 2, those answers reappear.

---

## 6. **Workflow Example**

### **Week 1-2: Round 1**
```
Admin → Activates Round 1
Users → See Round 1 matches, answer questions
       → Submit picks
       → View Round 1 leaderboard
```

### **Week 3-4: Round 2**
```
Admin → Activates Round 2
Users → Round 1 disappears from view
       → See Round 2 matches, answer questions
       → Submit picks
       → View Round 2 leaderboard
```

### **Week 5-6: Round 3**
```
Admin → Activates Round 3
Users → Rounds 1 & 2 disappear from view
       → See Round 3 matches, answer questions
       → Submit picks
       → View Round 3 leaderboard
```

---

## 7. **Admin Instructions**

### **To Change the Active Round:**

1. Go to **Admin Panel** (you must be an admin user)
2. Navigate to **Six Nations Manager** tab
3. Scroll to the **Tournament Rounds** section
4. Find the round you want to activate
5. Click the **"Activate"** button
6. ✅ Success! A green border and "Active" badge will appear
7. Users will see only this round's content when they refresh

### **To Create a New Round:**

1. Click **"Create Round"** button
2. Fill in:
   - Round Number (1-5)
   - Name (e.g., "Round 3")
   - Start Date
   - End Date
3. Click **"Create Round"**
4. Click **"Activate"** on the new round to make it visible to users

---

## 8. **Data Persistence**

### **What Happens to Old Data?**

**Nothing is deleted!** When you switch rounds:

- ✅ **Previous round matches** → Still in database
- ✅ **Previous round questions** → Still in database
- ✅ **User answers from previous rounds** → Still in database
- ✅ **Scores from previous rounds** → Still in database

Everything is preserved. Only the **visibility** changes based on `isActive`.

### **Viewing Historical Data**

Admins can still access all rounds:
- All rounds appear in the Rounds Manager
- Can activate any round to view its data
- Can switch back and forth between rounds

---

## 9. **API Reference**

### **Activate Round**
```http
PATCH /api/six-nations/rounds/:id/activate
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "id": "round-uuid",
  "roundNumber": 2,
  "name": "Round 2",
  "startDate": "2025-02-01T00:00:00.000Z",
  "endDate": "2025-02-15T23:59:59.000Z",
  "isActive": true
}
```

### **Get All Rounds**
```http
GET /api/six-nations/rounds
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
[
  {
    "id": "round-1-uuid",
    "roundNumber": 1,
    "name": "Round 1",
    "isActive": false,
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-01-15T23:59:59.000Z"
  },
  {
    "id": "round-2-uuid",
    "roundNumber": 2,
    "name": "Round 2",
    "isActive": true,  // ⭐ Currently active
    "startDate": "2025-02-01T00:00:00.000Z",
    "endDate": "2025-02-15T23:59:59.000Z"
  }
]
```

---

## 10. **Testing the Feature**

### **As Admin:**
1. Log in as admin user
2. Go to Admin Panel → Six Nations
3. Create multiple rounds (Round 1, Round 2, Round 3)
4. Activate Round 1
5. Create matches and questions for Round 1
6. Open app as regular user (different browser/incognito)

### **As User:**
1. Should see only Round 1 matches
2. Answer Round 1 questions
3. Check leaderboard (only Round 1 scores)

### **Switch Rounds:**
1. Back as admin, activate Round 2
2. Back as user, refresh page
3. Should see only Round 2 content now
4. Round 1 content hidden but preserved

---

## Summary

✅ **Backend filtering** ensures users only see active round data
✅ **Admin UI** provides easy one-click round activation
✅ **Visual indicators** clearly show which round is active
✅ **Data preservation** keeps all historical data safe
✅ **Automatic switching** between rounds for seamless tournament progression

The system is production-ready and requires no additional frontend filtering - everything is handled server-side!
