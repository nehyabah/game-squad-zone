# Six Nations Pick'em - UPDATED Implementation Plan (Admin-Driven)

> **KEY CHANGE:** Six Nations will NOT use external APIs. All fixtures, questions, answers, and scoring will be admin-managed through a custom admin panel.

---

## **PHASE 1: Frontend Sport Selection & UI Foundation (CURRENT PHASE)**

### **1.1 Sport Selection UI** 🎯 **START HERE**

- [ ] Create sport toggle/selector component (NFL ⚡ Six Nations 🏉)
- [ ] Design sport selection screen on app entry
- [ ] Add sport context/state management (React Context or Zustand)
- [ ] Update navigation to show active sport
- [ ] Create sport-specific branding/theming
- [ ] Store user's last selected sport in localStorage
- [ ] Add sport preference to user profile settings

### **1.2 Multi-Sport Architecture (Frontend)**

- [ ] Create `src/contexts/SportContext.tsx` for sport state
- [ ] Design routing structure: `/nfl/*` and `/sixnations/*`
- [ ] Create shared components (Leaderboard, SquadManager, etc.)
- [ ] Create sport-specific components (NFLPickCard, SixNationsQuestionCard)
- [ ] Plan component reusability vs duplication strategy

### **1.3 Six Nations UI Components (Initial)**

- [ ] Create `SixNationsMatchList.tsx` - Display matches by round
- [ ] Create `SixNationsQuestionCard.tsx` - Display question with answer options
- [ ] Create `SixNationsPickSheet.tsx` - Full pick submission view
- [ ] Create `SixNationsLeaderboard.tsx` - Round and overall standings
- [ ] Create `SixNationsRoundSelector.tsx` - Navigate between 5 rounds

---

## **PHASE 2: Database Schema & Backend Foundation**

### **2.1 Database Schema (Admin-Driven Model)**

#### **Core Tables**

```prisma
enum Sport {
  NFL
  SIX_NATIONS
}

model SixNationsMatch {
  id            String   @id @default(uuid())
  round         Int      // 1-5
  homeTeam      String   // "Ireland"
  awayTeam      String   // "England"
  kickoffTime   DateTime
  venue         String?
  completed     Boolean  @default(false)
  homeScore     Int?
  awayScore     Int?

  questions     SixNationsQuestion[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model SixNationsQuestion {
  id                String   @id @default(uuid())
  matchId           String
  match             SixNationsMatch @relation(fields: [matchId], references: [id])

  questionNumber    Int      // 1, 2, or 3
  questionText      String   // "Will Ireland beat England by 4+ points?"
  questionType      String   // "spread", "total", "prop"

  answers           SixNationsAnswer[]
  picks             SixNationsPick[]

  correctAnswerId   String?  // Set by admin after match
  correctAnswer     SixNationsAnswer? @relation("CorrectAnswer", fields: [correctAnswerId], references: [id])

  lockedAt          DateTime? // Line lock 24h before kickoff

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([matchId, questionNumber])
}

model SixNationsAnswer {
  id              String   @id @default(uuid())
  questionId      String
  question        SixNationsQuestion @relation(fields: [questionId], references: [id])

  answerText      String   // "Yes" or "No" or "Over 40.5" etc.
  answerValue     String?  // For display/calculation
  points          Float    @default(1.0) // Weighting/scoring

  picks           SixNationsPick[]
  correctForQuestions SixNationsQuestion[] @relation("CorrectAnswer")

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model SixNationsPick {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  questionId      String
  question        SixNationsQuestion @relation(fields: [questionId], references: [id])

  answerId        String
  answer          SixNationsAnswer @relation(fields: [answerId], references: [id])

  round           Int
  submittedAt     DateTime @default(now())
  lockedAt        DateTime?

  scored          Boolean  @default(false)
  correct         Boolean?
  pointsAwarded   Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, questionId])
  @@index([userId, round])
}

model SixNationsLeaderboard {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  round           Int?     // null = overall season
  totalPoints     Float    @default(0)
  correctPicks    Int      @default(0)
  totalPicks      Int      @default(0)
  rank            Int?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, round])
  @@index([round, totalPoints])
}
```

### **2.2 Backend API Endpoints**

#### **Admin Endpoints** (Protected)

```
POST   /api/admin/sixnations/matches              - Create match
PUT    /api/admin/sixnations/matches/:id          - Update match
DELETE /api/admin/sixnations/matches/:id          - Delete match

POST   /api/admin/sixnations/questions            - Create question for match
PUT    /api/admin/sixnations/questions/:id        - Edit question
DELETE /api/admin/sixnations/questions/:id        - Delete question

POST   /api/admin/sixnations/answers              - Create answer for question
PUT    /api/admin/sixnations/answers/:id          - Edit answer (text, points)
DELETE /api/admin/sixnations/answers/:id          - Delete answer

POST   /api/admin/sixnations/questions/:id/correct-answer  - Set correct answer
POST   /api/admin/sixnations/matches/:id/results  - Submit match result & trigger scoring
POST   /api/admin/sixnations/matches/:id/lock     - Lock questions 24h before kickoff
```

#### **User Endpoints**

```
GET    /api/sixnations/matches?round=              - List matches by round
GET    /api/sixnations/matches/:id                 - Get match details with questions
POST   /api/sixnations/picks                       - Submit picks for round
GET    /api/sixnations/picks?round=&userId=        - Get user's picks
GET    /api/sixnations/leaderboard?round=          - Get leaderboard
GET    /api/sixnations/my-stats                    - Get personal statistics
```

---

## **PHASE 3: Admin Panel (Critical for Admin-Driven Model)**

### **3.1 Admin Dashboard**

- [ ] Create `/admin/sixnations` route (protected)
- [ ] Create admin sidebar navigation
- [ ] Add role-based access control (admin users only)
- [ ] Create admin home dashboard with overview

### **3.2 Match Management UI**

- [ ] **Create Match Form**
  - Round selector (1-5)
  - Home team input
  - Away team input
  - Kickoff date/time picker
  - Venue input (optional)
- [ ] **Match List View**
  - Display all 15 matches
  - Filter by round
  - Sort by kickoff time
  - Show match status (upcoming, completed)
- [ ] **Edit Match**
  - Update match details
  - Submit final scores
  - Mark match as completed

### **3.3 Question Management UI**

- [ ] **Create Question Form**
  - Select match
  - Question number (1, 2, 3)
  - Question type (spread, total, prop)
  - Question text input
- [ ] **Question List View**
  - Display questions per match
  - Show question status (locked, unlocked)
  - Edit/Delete actions
- [ ] **Lock Questions**
  - Manual lock button (24h before kickoff)
  - Show locked status with timestamp

### **3.4 Answer Management UI**

- [ ] **Create Answer Form**
  - Select question
  - Answer text (e.g., "Yes", "Over 40.5")
  - Answer value (optional for display)
  - Points/weighting (default: 1.0)
- [ ] **Answer List View**
  - Display all answers for a question
  - Edit answer text and points
  - Delete answers
  - Mark correct answer (post-match)

### **3.5 Scoring Management UI**

- [ ] **Match Results Entry**
  - Enter home score
  - Enter away score
  - Mark match as completed
- [ ] **Set Correct Answers**
  - For each question, select correct answer
  - Preview scoring before finalizing
- [ ] **Trigger Scoring**
  - Button to run scoring for completed match
  - Show scoring progress and results
  - Display users affected

### **3.6 Admin Analytics**

- [ ] View pick submission rate by round
- [ ] View most/least popular answers
- [ ] View user engagement metrics
- [ ] Export picks data (CSV)

---

## **PHASE 4: User Pick Submission Flow**

### **4.1 Pick Submission UI**

- [ ] Display matches for selected round (3 matches)
- [ ] Display 3 questions per match (9 questions total)
- [ ] Radio buttons or cards for answer selection
- [ ] Show points for each answer (if weighted)
- [ ] Pick summary/review before submission
- [ ] Submit picks API call
- [ ] Show confirmation message

### **4.2 Pick Locking**

- [ ] Display countdown timer to lock deadline
- [ ] Show "Locked" badge when deadline passes
- [ ] Prevent editing locked picks
- [ ] Display locked picks in read-only mode

### **4.3 My Picks View**

- [ ] Display user's picks by round
- [ ] Show question, selected answer, points
- [ ] Show correct answer (after match completion)
- [ ] Show points awarded (won/lost)

---

## **PHASE 5: Scoring & Leaderboard**

### **5.1 Scoring Logic (Backend)**

- [ ] Fetch completed match
- [ ] Get all questions with correct answers set
- [ ] Find all user picks for those questions
- [ ] Compare pick answer with correct answer
- [ ] Award points based on answer weighting
- [ ] Update SixNationsPick (scored, correct, pointsAwarded)
- [ ] Update SixNationsLeaderboard (round and overall)

### **5.2 Leaderboard UI**

- [ ] Display round leaderboard (top users for round)
- [ ] Display overall leaderboard (cumulative points)
- [ ] Show rank, username, points, correct picks
- [ ] Filter by league/squad (if applicable)
- [ ] Highlight current user

---

## **PHASE 6: Testing & Polish**

### **6.1 Admin Testing**

- [ ] Test full match creation flow
- [ ] Test question creation with multiple answers
- [ ] Test answer weighting (different point values)
- [ ] Test setting correct answers
- [ ] Test scoring calculation
- [ ] Test editing questions/answers after creation

### **6.2 User Testing**

- [ ] Test sport selection flow
- [ ] Test pick submission (all 9 questions)
- [ ] Test pick locking (deadline enforcement)
- [ ] Test leaderboard updates after scoring
- [ ] Test missed pick scenarios (incomplete submissions)

### **6.3 Edge Cases**

- [ ] Match postponement handling
- [ ] Incorrect correct answer (admin override)
- [ ] Partial pick submissions
- [ ] Duplicate picks prevention
- [ ] Late submissions (after lock)

---

## **CRITICAL PATH (MVP - Must Have)**

### **Week 1-2: Frontend Foundation**

1. ✅ Sport selection UI (NFL ⚡ Six Nations 🏉)
2. ✅ Sport context and routing
3. ✅ Six Nations match list UI
4. ✅ Six Nations question card UI
5. ✅ Pick submission form UI

### **Week 3-4: Backend & Database**

6. ✅ Database schema migration
7. ✅ Admin API endpoints (matches, questions, answers)
8. ✅ User API endpoints (picks, leaderboard)
9. ✅ Scoring service logic

### **Week 5-6: Admin Panel**

10. ✅ Admin dashboard and navigation
11. ✅ Match management UI
12. ✅ Question management UI
13. ✅ Answer management UI (with weighting)
14. ✅ Correct answer selection UI
15. ✅ Scoring trigger UI

### **Week 7-8: Integration & Testing**

16. ✅ End-to-end pick submission flow
17. ✅ End-to-end scoring flow (admin → user)
18. ✅ Leaderboard calculation and display
19. ✅ Testing and bug fixes

---

## **NICE TO HAVE (Post-MVP)**

- League/squad integration for Six Nations
- Missed pick notification system
- Confidence points (rank your answers)
- Social sharing of picks
- Mobile app optimization
- Historical data/archives
- Advanced analytics

---

## **OPEN QUESTIONS TO RESOLVE**

1. **Admin Users:** Who should have admin access? Create separate admin role?
2. **Weighting Strategy:** Should all answers be 1 point or allow custom weights per question?
3. **Leagues:** Should Six Nations use same squads as NFL or separate leagues?
4. **Prize Pool:** Integrate Stripe payments for Six Nations tournaments?
5. **Missed Picks:** Zero points or partial credit?
6. **Multi-Sport Squads:** Can a squad play both NFL and Six Nations?
7. **Timeline:** Target launch date? Six Nations 2026 starts February 2026.

---

## **TIMELINE ESTIMATE (Admin-Driven Model)**

- **Phase 1:** Frontend Sport Selection & UI (2 weeks)
- **Phase 2:** Database Schema & Backend APIs (2 weeks)
- **Phase 3:** Admin Panel (2 weeks) ⚠️ **Critical for admin-driven model**
- **Phase 4:** User Pick Submission (1 week)
- **Phase 5:** Scoring & Leaderboard (1 week)
- **Phase 6:** Testing & Polish (1 week)

**Total:** ~9 weeks (2 months) for full MVP

**Target Launch:** January 2026 (1 month before Six Nations 2026 starts)

---

**Last Updated:** 2025-11-20
**Status:** Phase 1 - Frontend Sport Selection (IN PROGRESS)
**Target Launch:** February 2026 (Six Nations Round 1)

---

## **Phase 2: Database & Backend Foundation (Week 2-4)**

### **Database Schema**

- [ ] Create `Sport` enum/table (NFL, SixNations)
- [ ] Create `SixNationsFixture` table (match, round, teams, kickoff time)
- [ ] Create `SixNationsQuestion` table (fixture FK, type: spread/total/prop, line value)
- [ ] Create `SixNationsLine` table (locked lines with timestamps)
- [ ] Create `SixNationsPick` table (user, question, answer, locked line)
- [ ] Create `SixNationsLeague` table (private leagues)
- [ ] Create `SixNationsLeaderboard` table (cumulative and round-based)
- [ ] Add `sport` field to User preferences
- [ ] Update PickSet/Pick schema to support multiple sports (or create separate tables)

### **Backend APIs**

- [ ] Implement `/api/sixnations/fixtures` (list matches by round)
- [ ] Implement `/api/sixnations/questions/:fixtureId` (get 3 questions per match)
- [ ] Implement `/api/sixnations/picks` (submit answers)
- [ ] Implement `/api/sixnations/picks/:userId/:round` (get user's picks)
- [ ] Implement `/api/sixnations/leagues` (create, join, list)
- [ ] Implement `/api/sixnations/leaderboard/:leagueId`
- [ ] Implement `/api/sixnations/leaderboard/public` (public pool)
- [ ] Implement admin endpoints for line overrides
- [ ] Create line locking service (cron job 24h before kickoff)

### **Data Services**

- [ ] Create SixNationsOddsService (fetch spread, total, props from API)
- [ ] Create SixNationsFixtureService (manage fixtures and rounds)
- [ ] Create SixNationsScoringService (calculate points after match completion)
- [ ] Create SixNationsLeagueService (private league management)
- [ ] Create missed pick handler (auto-fill or zero-fill logic)

---

## **Phase 3: Frontend Foundation (Week 4-6)**

### **Sport Selection Flow**

- [ ] Create SportsHub component (NFL Pick'em vs Six Nations cards)
- [ ] Add sport selection to user preferences/settings
- [ ] Update navigation to show active sport
- [ ] Create sport-switching mechanism (maintain context)
- [ ] Design sport-specific branding (colors, logos, themes)

### **Six Nations UI Components**

- [ ] Create SixNationsFixturesList component
- [ ] Create SixNationsQuestionCard component (3 questions per match)
- [ ] Create SixNationsPickSubmission form
- [ ] Create SixNationsLeagueCreation form
- [ ] Create SixNationsLeagueJoin component (code entry)
- [ ] Create SixNationsLeaderboard component (round and overall)
- [ ] Create SixNationsMyPicks view (review submitted picks)
- [ ] Create SixNationsRoundSelector (navigate between 5 rounds)

### **User Experience**

- [ ] Add countdown timer to line lock deadline
- [ ] Show locked lines on pick submission page
- [ ] Display "Picks Locked" badge when deadline passes
- [ ] Create missed pick notification/reminder system
- [ ] Design mobile-friendly layout for 3 questions per match

---

## **Phase 4: Core Features (Week 6-9)**

### **Fixture & Question Management**

- [ ] Admin panel to add/edit Six Nations fixtures
- [ ] Admin panel to set questions (spread, total, prop)
- [ ] Automated odds fetching from API (if available)
- [ ] Line locking mechanism (scheduled job 24h before kickoff)
- [ ] Manual line override by admin
- [ ] Match cancellation/postponement handling

### **Pick Submission**

- [ ] Implement pick submission with validation
- [ ] Lock picks after deadline
- [ ] Show preview of locked picks before submission
- [ ] Prevent pick changes after lock time
- [ ] Handle partial submissions (some matches picked, others missed)

### **Scoring & Results**

- [ ] Fetch match results (scores, try scorers)
- [ ] Auto-score Q1 (spread) and Q2 (total)
- [ ] Manual entry for Q3 (bonus props like try scorers)
- [ ] Calculate round points (9 questions max per round)
- [ ] Update cumulative leaderboard
- [ ] Show correct answers after match completion

### **Leagues & Social**

- [ ] Create private league (generate join code)
- [ ] Join league via code
- [ ] View league members and their picks (after lock)
- [ ] League chat/messaging (optional)
- [ ] Public pool leaderboard (all players)

---

## **Phase 5: Missed Picks & Edge Cases (Week 9-10)**

### **Missed Pick Strategies (Choose One)**

**Option A: Zero Points**

- [ ] Award 0 points for missed questions
- [ ] Simple, fair, encourages participation

**Option B: Average Score**

- [ ] Award 50% of possible points (0.5 per question)
- [ ] Reduces penalty, maintains engagement

**Option C: Most Popular Pick**

- [ ] Auto-select the most common answer from league
- [ ] Complex, requires real-time calculation

**Option D: Carry Forward**

- [ ] Use previous week's picks for same teams (not applicable here)

**Recommendation:** Start with Option A (zero points), add Option B later based on feedback.

### **Edge Case Handling**

- [ ] Match postponement (freeze picks, extend deadline)
- [ ] Match cancellation (void questions, refund picks)
- [ ] Incorrect line posted (admin override, recalculate scores)
- [ ] API failure (fallback to manual entry)
- [ ] User submits after deadline (reject with clear error)
- [ ] Tie in leaderboard (apply tiebreaker rules)

---

## **Phase 6: Admin Tools (Week 10-11)**

### **Admin Dashboard**

- [ ] View all fixtures and questions
- [ ] Edit/override locked lines
- [ ] Manually enter match results
- [ ] Manually score bonus props (Q3)
- [ ] View user picks (after lock)
- [ ] Override scores for corrections
- [ ] Cancel/void matches
- [ ] Send notifications to users

### **Monitoring & Alerts**

- [ ] Alert when lines don't lock on time
- [ ] Alert when match results missing
- [ ] Alert when scoring fails
- [ ] Dashboard showing pick submission rate per round
- [ ] Dashboard showing league activity

---

## **Phase 7: Testing & Polish (Week 11-12)**

### **Testing**

- [ ] Test full pick submission flow
- [ ] Test line locking mechanism (schedule test locks)
- [ ] Test scoring across all 3 question types
- [ ] Test leaderboard calculations and tiebreakers
- [ ] Test league creation and joining
- [ ] Test missed pick scenarios
- [ ] Test admin overrides
- [ ] Load test with 100+ users
- [ ] Mobile responsiveness testing

### **Polish & UX**

- [ ] Add Six Nations branding/theme
- [ ] Create onboarding guide for new users
- [ ] Add tooltips explaining question types
- [ ] Show historical round performance
- [ ] Add statistics (most correct answers, hardest question, etc.)
- [ ] Celebrate weekly winners

---

## **Phase 8: Launch Prep (Week 12-13)**

### **Pre-Launch**

- [ ] Create Six Nations fixtures for full tournament (5 rounds, 15 matches)
- [ ] Set up question templates for all 45 questions
- [ ] Configure line fetching API integration
- [ ] Set up cron jobs for line locking
- [ ] Create public pool league
- [ ] Prepare launch announcement
- [ ] Create user guide/FAQ

### **Launch**

- [ ] Soft launch with beta users
- [ ] Monitor for issues
- [ ] Gather feedback
- [ ] Fix critical bugs
- [ ] Full launch before Round 1 kickoff

---

## **Phase 9: Post-Launch (Ongoing)**

### **Maintenance**

- [ ] Monitor line locking daily
- [ ] Enter match results promptly
- [ ] Score bonus props manually
- [ ] Respond to user issues
- [ ] Handle admin overrides as needed

### **Enhancements (Future)**

- [ ] Add "Confidence Points" (rank your 9 answers)
- [ ] Add weekly prizes/badges
- [ ] Add Six Nations statistics page
- [ ] Add head-to-head comparisons
- [ ] Add push notifications for missed picks
- [ ] Add social sharing of results

---

## **Critical Path Items (Must Have for MVP)**

1. ✅ Sport selection screen
2. ✅ Six Nations fixture display
3. ✅ 3-question pick submission per match
4. ✅ Line locking 24h before kickoff
5. ✅ Basic scoring (1 point per correct answer)
6. ✅ Leaderboard (round and overall)
7. ✅ Private league creation/joining
8. ✅ Missed pick handling (zero points)
9. ✅ Admin manual result entry

---

## **Nice to Have (Post-MVP)**

- Public pool competition
- Advanced statistics
- Social features (chat, sharing)
- Mobile app
- Push notifications
- Confidence points
- Historical data/archives

---

## **Open Questions to Resolve**

1. **Odds API:** Which API provides Six Nations odds (spread, total, props)?
2. **Try Scorer Props:** How to handle multiple prop options (manual selection)?
3. **Public vs Private:** Is public pool required for launch or post-launch?
4. **Prize Pool:** Same Stripe integration as NFL or separate?
5. **Missed Picks:** Zero points or 50% points?
6. **Multi-Sport Users:** Can users play both NFL and Six Nations simultaneously?
7. **Data Retention:** Archive old tournaments or keep forever?

---

## **Tournament Structure Reference**

**Six Nations 2025 (Example):**

- **Duration:** 5 Rounds (February - March)
- **Matches:** 3 matches per round = 15 total matches
- **Questions:** 3 questions per match = 9 questions per round = 45 total questions
- **Scoring:** 1 point per correct answer = 9 points max per round = 45 points max overall

**Match Structure:**

```
Round 1 (Example):
├── Match 1: Ireland vs England
│   ├── Q1: Will Ireland beat England by 4+ points? (Spread: -3.5)
│   ├── Q2: Will there be more than 40.5 points scored? (Total: 40.5)
│   └── Q3: Will James Lowe score a try? (Prop: Yes/No)
├── Match 2: Scotland vs Wales
│   ├── Q1: Spread question
│   ├── Q2: Total question
│   └── Q3: Prop question
└── Match 3: France vs Italy
    ├── Q1: Spread question
    ├── Q2: Total question
    └── Q3: Prop question
```

---

## **Timeline Estimate**

- **Phase 1-2:** 4 weeks (Planning + Backend Foundation)
- **Phase 3:** 2 weeks (Frontend Foundation)
- **Phase 4:** 3 weeks (Core Features)
- **Phase 5:** 1 week (Edge Cases)
- **Phase 6:** 1 week (Admin Tools)
- **Phase 7:** 1 week (Testing)
- **Phase 8:** 1 week (Launch Prep)

**Total:** 13 weeks (~3 months) for full MVP

**Critical for Six Nations 2025:** Launch must be complete by early February 2025 (before Round 1).

---

## **Team Allocation Suggestion**

- **Backend Developer:** Database schema, APIs, scoring logic (4 weeks)
- **Frontend Developer:** UI components, sport selection, pick submission (4 weeks)
- **Full-Stack Developer:** Integration, admin tools, testing (3 weeks)
- **Product Manager:** Business logic, testing, launch coordination (ongoing)

---

## **Notes**

- This is a substantial expansion to the existing NFL Pick'em platform
- Consider code reuse: leaderboard logic, league management, user authentication
- Six Nations has simpler structure than NFL (5 rounds vs 18 weeks, 3 questions vs 3 picks)
- Main complexity: multi-sport architecture and question-based scoring
- Budget ~13 weeks for full implementation
- Recommend starting immediately to hit February 2025 Six Nations start date

---

**Last Updated:** 2025-11-04
**Status:** Planning Phase
**Target Launch:** February 2025 (Six Nations Round 1)
