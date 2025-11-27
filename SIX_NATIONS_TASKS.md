# Six Nations Implementation - Task & Feature List

> **Admin-Driven Model** - No external APIs. All content managed through admin panel.

---

## 📋 **PHASE 1: FRONTEND FOUNDATION (Week 1-2)**

### **Task 1.1: Sport Selection System**
**Features:**
- [ ] Sport toggle component with NFL ⚡ and Six Nations 🏉 icons
- [ ] Sport selection screen on app entry/home page
- [ ] Save selected sport to localStorage
- [ ] Remember user's last selected sport on return visit

**Technical Tasks:**
- [ ] Create `src/types/sport.ts` with Sport enum
- [ ] Create `src/contexts/SportContext.tsx` for global sport state
- [ ] Create `src/components/SportSelector.tsx` component
- [ ] Add sport selection to user profile/settings
- [ ] Style sport selector with team colors (NFL: blue/red, Six Nations: green/white)

---

### **Task 1.2: Routing & Navigation**
**Features:**
- [ ] Separate routes for NFL and Six Nations
- [ ] Navigation bar shows current active sport
- [ ] Sport-specific branding in header/navigation
- [ ] Smooth transitions between sports

**Technical Tasks:**
- [ ] Update `src/App.tsx` or router with sport-based routes:
  - `/nfl/dashboard`
  - `/nfl/picks`
  - `/nfl/leaderboard`
  - `/sixnations/dashboard`
  - `/sixnations/picks`
  - `/sixnations/leaderboard`
- [ ] Create `src/components/SportNav.tsx` for sport-specific navigation
- [ ] Update Header component to show active sport badge
- [ ] Add route guards to ensure sport context is set

---

### **Task 1.3: Six Nations UI Components**
**Features:**
- [ ] Display matches by round (Round 1-5 selector)
- [ ] Show 3 questions per match in cards
- [ ] Display answer options with radio buttons
- [ ] Show point values for each answer (if weighted)
- [ ] Pick submission form with validation
- [ ] Lock status indicator (locked/unlocked)
- [ ] Countdown timer to lock deadline

**Technical Tasks:**
- [ ] Create `src/components/sixnations/SixNationsMatchList.tsx`
  - Filter matches by round
  - Sort by kickoff time
  - Show match status badges (upcoming, live, completed)

- [ ] Create `src/components/sixnations/SixNationsQuestionCard.tsx`
  - Display question text
  - Show question type badge (spread/total/prop)
  - List answer options with radio buttons
  - Show points per answer
  - Disable if locked

- [ ] Create `src/components/sixnations/SixNationsPickSheet.tsx`
  - Display all 9 questions for a round (3 matches × 3 questions)
  - Track selected answers
  - Validation (ensure all questions answered)
  - Submit button with confirmation
  - Success/error toast messages

- [ ] Create `src/components/sixnations/SixNationsRoundSelector.tsx`
  - Round tabs (1-5)
  - Active round indicator
  - Disabled for future rounds

- [ ] Create `src/components/sixnations/SixNationsLeaderboard.tsx`
  - Round leaderboard view
  - Overall season leaderboard view
  - User rank and points
  - Top 10 display with expand for more

- [ ] Create `src/components/sixnations/SixNationsMyPicks.tsx`
  - Display user's picks by round
  - Show selected answer vs correct answer
  - Show points awarded (won/lost/pending)
  - Filter by round

---

### **Task 1.4: API Client Layer**
**Technical Tasks:**
- [ ] Create `src/lib/api/sixnations.ts` with API functions:
  - `getMatches(round?: number)`
  - `getMatchDetails(matchId: string)`
  - `submitPicks(picks: SixNationsPick[])`
  - `getMyPicks(round?: number)`
  - `getLeaderboard(round?: number)`
  - `getMyStats()`
- [ ] Add TypeScript types for Six Nations entities
- [ ] Create custom hooks:
  - `src/hooks/use-sixnations-matches.ts`
  - `src/hooks/use-sixnations-picks.ts`
  - `src/hooks/use-sixnations-leaderboard.ts`

---

## 🗄️ **PHASE 2: DATABASE & BACKEND (Week 3-4)**

### **Task 2.1: Database Schema**
**Features:**
- [ ] Store matches, questions, answers, picks, leaderboard
- [ ] Support point weighting per answer
- [ ] Track correct answers set by admin
- [ ] Lock questions before kickoff

**Technical Tasks:**
- [ ] Add to `backend/prisma/schema.prisma`:
  - `Sport` enum (NFL, SIX_NATIONS)
  - `SixNationsMatch` model
  - `SixNationsQuestion` model
  - `SixNationsAnswer` model
  - `SixNationsPick` model
  - `SixNationsLeaderboard` model
- [ ] Update `User` model with sport preference field
- [ ] Create Prisma migration: `npx prisma migrate dev --name add_sixnations_models`
- [ ] Generate Prisma client: `npx prisma generate`

---

### **Task 2.2: Backend Modules**
**Technical Tasks:**
- [ ] Create `backend/src/modules/sixnations/` folder structure:
  - `sixnations.routes.ts`
  - `sixnations.service.ts`
  - `sixnations.schema.ts` (Zod validation)
  - `sixnations.types.ts`

- [ ] Create `backend/src/modules/sixnations-admin/` folder:
  - `sixnations-admin.routes.ts`
  - `sixnations-admin.service.ts`
  - `sixnations-admin.schema.ts`

---

### **Task 2.3: User API Endpoints**
**Features:**
- [ ] Users can view matches by round
- [ ] Users can view questions for a match
- [ ] Users can submit picks for a round
- [ ] Users can view their own picks
- [ ] Users can view leaderboards

**Technical Tasks:**
- [ ] `GET /api/sixnations/matches?round=` - List matches
- [ ] `GET /api/sixnations/matches/:id` - Get match with questions
- [ ] `POST /api/sixnations/picks` - Submit picks
  - Validate all 9 questions answered
  - Check if already submitted
  - Check if locked
  - Store picks with user association
- [ ] `GET /api/sixnations/picks?round=` - Get user's picks
- [ ] `GET /api/sixnations/leaderboard?round=` - Get leaderboard
  - Support round-specific and overall
  - Return top 100 users
  - Include user's rank if not in top 100
- [ ] `GET /api/sixnations/my-stats` - Get personal statistics
  - Total points
  - Correct picks count
  - Best round
  - Current rank

---

### **Task 2.4: Admin API Endpoints**
**Features:**
- [ ] Admins can create/edit/delete matches
- [ ] Admins can create/edit/delete questions
- [ ] Admins can create/edit/delete answers (with points)
- [ ] Admins can set correct answers after matches
- [ ] Admins can trigger scoring
- [ ] Admins can lock questions

**Technical Tasks:**
- [ ] Add `isAdmin` field to User model (boolean, default false)
- [ ] Create admin auth middleware: `backend/src/middleware/admin-auth.ts`
- [ ] Implement admin routes (protected by admin middleware):

**Match Management:**
- [ ] `POST /api/admin/sixnations/matches` - Create match
  - Body: { round, homeTeam, awayTeam, kickoffTime, venue }
- [ ] `PUT /api/admin/sixnations/matches/:id` - Update match
- [ ] `DELETE /api/admin/sixnations/matches/:id` - Delete match
- [ ] `POST /api/admin/sixnations/matches/:id/results` - Submit match result
  - Body: { homeScore, awayScore }
  - Mark match as completed

**Question Management:**
- [ ] `POST /api/admin/sixnations/questions` - Create question
  - Body: { matchId, questionNumber, questionText, questionType }
- [ ] `PUT /api/admin/sixnations/questions/:id` - Update question
- [ ] `DELETE /api/admin/sixnations/questions/:id` - Delete question
- [ ] `POST /api/admin/sixnations/questions/:id/lock` - Lock question manually

**Answer Management:**
- [ ] `POST /api/admin/sixnations/answers` - Create answer
  - Body: { questionId, answerText, answerValue, points }
- [ ] `PUT /api/admin/sixnations/answers/:id` - Update answer (text, points)
- [ ] `DELETE /api/admin/sixnations/answers/:id` - Delete answer

**Correct Answer & Scoring:**
- [ ] `POST /api/admin/sixnations/questions/:id/correct-answer` - Set correct answer
  - Body: { correctAnswerId }
  - Automatically triggers scoring for this question
- [ ] `POST /api/admin/sixnations/matches/:id/score` - Trigger scoring for entire match
  - Scores all 3 questions
  - Updates user leaderboards

**Analytics:**
- [ ] `GET /api/admin/sixnations/stats` - Get admin analytics
  - Pick submission rate by round
  - Most popular answers
  - User engagement metrics

---

### **Task 2.5: Scoring Service**
**Features:**
- [ ] Automatically score picks when correct answer is set
- [ ] Award points based on answer weighting
- [ ] Update round and overall leaderboards
- [ ] Handle edge cases (no picks, partial picks)

**Technical Tasks:**
- [ ] Create `backend/src/services/sixnations-scoring.service.ts`
- [ ] Implement `scoreQuestion(questionId: string)` method:
  - Find all picks for this question
  - Get correct answer
  - Compare each pick's answer with correct answer
  - Award points if correct
  - Update `SixNationsPick` (scored, correct, pointsAwarded)
- [ ] Implement `scoreMatch(matchId: string)` method:
  - Score all 3 questions for the match
  - Update user leaderboards
- [ ] Implement `updateLeaderboard(userId: string, round: number)` method:
  - Calculate total points for round
  - Calculate total points for season
  - Update rank

---

### **Task 2.6: Pick Locking Service**
**Features:**
- [ ] Auto-lock questions 24h before match kickoff
- [ ] Manual lock by admin
- [ ] Prevent pick changes after lock

**Technical Tasks:**
- [ ] Create `backend/src/services/sixnations-lock.service.ts`
- [ ] Implement `lockQuestionsForMatch(matchId: string)` method
- [ ] Create cron job to run hourly:
  - Find matches with kickoff within 24h
  - Lock all questions for those matches
  - Set `lockedAt` timestamp
- [ ] Update pick submission to check lock status

---

## 🎛️ **PHASE 3: ADMIN PANEL (Week 5-6)**

### **Task 3.1: Admin Dashboard Layout**
**Features:**
- [ ] Protected admin route (only accessible to admin users)
- [ ] Sidebar navigation for admin sections
- [ ] Overview dashboard with stats
- [ ] Quick actions panel

**Technical Tasks:**
- [ ] Create `src/pages/admin/SixNationsAdmin.tsx`
- [ ] Create `src/components/admin/AdminLayout.tsx`
  - Sidebar with sections:
    - Dashboard
    - Matches
    - Questions & Answers
    - Scoring
    - Analytics
- [ ] Create `src/components/admin/AdminDashboard.tsx`
  - Stats cards: Total matches, Total questions, Pick submissions, Active users
  - Quick actions: Create match, Lock questions, Run scoring
- [ ] Add admin route guard (check user.isAdmin)

---

### **Task 3.2: Match Management UI**
**Features:**
- [ ] View all 15 matches in a table
- [ ] Filter by round
- [ ] Create new match with form
- [ ] Edit existing match
- [ ] Delete match (with confirmation)
- [ ] Submit match results (scores)
- [ ] Mark match as completed

**Technical Tasks:**
- [ ] Create `src/pages/admin/MatchManagement.tsx`
- [ ] Create `src/components/admin/MatchList.tsx`
  - Table with columns: Round, Teams, Kickoff, Status, Actions
  - Filter dropdown for rounds
  - Sort by kickoff time
- [ ] Create `src/components/admin/MatchForm.tsx`
  - Form fields:
    - Round (1-5 dropdown)
    - Home Team (text input)
    - Away Team (text input)
    - Kickoff Time (date-time picker)
    - Venue (text input, optional)
  - Validation
  - Submit to API
- [ ] Create `src/components/admin/MatchResults.tsx`
  - Modal or form for entering final scores
  - Home Score input
  - Away Score input
  - Submit button to complete match

---

### **Task 3.3: Question Management UI**
**Features:**
- [ ] View all questions grouped by match
- [ ] Create question for a match
- [ ] Edit question text and type
- [ ] Delete question
- [ ] Lock/unlock question
- [ ] Show lock status with timestamp

**Technical Tasks:**
- [ ] Create `src/pages/admin/QuestionManagement.tsx`
- [ ] Create `src/components/admin/QuestionList.tsx`
  - Grouped by match
  - Show question number, text, type, lock status
  - Actions: Edit, Delete, Lock
- [ ] Create `src/components/admin/QuestionForm.tsx`
  - Select match (dropdown of all matches)
  - Question number (1, 2, 3)
  - Question type (spread, total, prop)
  - Question text (textarea)
  - Submit to API
- [ ] Create lock/unlock toggle button
  - Show "Locked" badge with timestamp
  - Show "Unlocked" badge

---

### **Task 3.4: Answer Management UI**
**Features:**
- [ ] View all answers for a question
- [ ] Create multiple answers per question
- [ ] Edit answer text and point value
- [ ] Delete answer
- [ ] Set correct answer (post-match)
- [ ] Show which answer is correct

**Technical Tasks:**
- [ ] Create `src/pages/admin/AnswerManagement.tsx`
- [ ] Create `src/components/admin/AnswerList.tsx`
  - Grouped by question
  - Show answer text, points, correct indicator
  - Actions: Edit, Delete, Set as Correct
- [ ] Create `src/components/admin/AnswerForm.tsx`
  - Select question (dropdown)
  - Answer text (text input)
  - Answer value (optional text input for display)
  - Points (number input, default 1.0)
  - Submit to API
- [ ] Create "Set as Correct" button
  - Opens confirmation modal
  - Preview scoring impact
  - Triggers scoring when confirmed

---

### **Task 3.5: Scoring Management UI**
**Features:**
- [ ] View matches ready for scoring
- [ ] Set correct answers for all 3 questions
- [ ] Trigger scoring for match
- [ ] Show scoring results (users affected, points awarded)
- [ ] Override scoring (manual corrections)

**Technical Tasks:**
- [ ] Create `src/pages/admin/ScoringManagement.tsx`
- [ ] Create `src/components/admin/ScoringPanel.tsx`
  - List completed matches
  - Show questions with answer options
  - Radio buttons to select correct answer per question
  - "Run Scoring" button
  - Results display:
    - Total picks scored
    - Points awarded
    - Leaderboard updates
- [ ] Create scoring preview modal
  - Show how many users will be affected
  - Show points distribution
  - Confirm before executing

---

### **Task 3.6: Admin Analytics UI**
**Features:**
- [ ] View pick submission rate by round
- [ ] View most/least popular answers
- [ ] View user engagement metrics
- [ ] Export picks data (CSV)
- [ ] View recent admin actions log

**Technical Tasks:**
- [ ] Create `src/pages/admin/Analytics.tsx`
- [ ] Create charts/graphs:
  - Pick submission rate per round (bar chart)
  - Most popular answers (pie chart)
  - User engagement over time (line chart)
- [ ] Create export button for CSV download
- [ ] Create admin actions log table:
  - Timestamp, Admin, Action, Details

---

## 👤 **PHASE 4: USER PICK FLOW (Week 7)**

### **Task 4.1: Pick Submission Flow**
**Features:**
- [ ] User selects round (1-5)
- [ ] View 3 matches for the round
- [ ] Answer 9 questions (3 per match)
- [ ] See point values for each answer
- [ ] Validate all questions answered
- [ ] Preview picks before submission
- [ ] Submit picks to backend
- [ ] Show confirmation message
- [ ] Prevent changes after lock

**Technical Tasks:**
- [ ] Create pick submission wizard/form
- [ ] Add client-side validation
- [ ] Implement optimistic UI updates
- [ ] Handle submission errors gracefully
- [ ] Redirect to "My Picks" after successful submission

---

### **Task 4.2: Lock Countdown & Status**
**Features:**
- [ ] Show countdown timer to lock deadline (24h before kickoff)
- [ ] Display "Locked" badge when deadline passes
- [ ] Disable editing of locked picks
- [ ] Show locked picks in read-only mode
- [ ] Send notification before lock (optional)

**Technical Tasks:**
- [ ] Create countdown timer component
- [ ] Update UI based on lock status
- [ ] Fetch lock status from API
- [ ] Show lock timestamp

---

### **Task 4.3: My Picks View**
**Features:**
- [ ] Display user's picks by round
- [ ] Show question text and selected answer
- [ ] Show correct answer (after match completion)
- [ ] Show points awarded (won/lost/pending)
- [ ] Filter by round
- [ ] Show overall statistics

**Technical Tasks:**
- [ ] Create picks history component
- [ ] Color code correct/incorrect answers
- [ ] Show pending picks (not yet scored)
- [ ] Show total points per round

---

## 🏆 **PHASE 5: LEADERBOARD & SCORING (Week 8)**

### **Task 5.1: Leaderboard Display**
**Features:**
- [ ] Round leaderboard (points for specific round)
- [ ] Overall leaderboard (cumulative points)
- [ ] User rank display
- [ ] Top 100 users list
- [ ] Filter by league/squad (optional)
- [ ] Highlight current user
- [ ] Refresh on new scores

**Technical Tasks:**
- [ ] Implement real-time leaderboard updates
- [ ] Add pagination for large leaderboards
- [ ] Show user's rank even if outside top 100
- [ ] Add animations for rank changes

---

### **Task 5.2: Personal Statistics**
**Features:**
- [ ] Total points earned
- [ ] Correct picks count
- [ ] Best round performance
- [ ] Current rank
- [ ] Favorite teams/answers
- [ ] Win rate percentage

**Technical Tasks:**
- [ ] Create stats dashboard component
- [ ] Fetch personal stats from API
- [ ] Display with charts/graphs
- [ ] Show historical performance

---

## 🧪 **PHASE 6: TESTING & POLISH (Week 9)**

### **Task 6.1: Admin Testing Checklist**
- [ ] Create match → questions → answers → set correct → score (full flow)
- [ ] Test editing match details
- [ ] Test deleting questions/answers
- [ ] Test answer point weighting (1 point vs 2 points)
- [ ] Test lock functionality (manual and auto)
- [ ] Test scoring with different scenarios:
  - All users correct
  - Mixed correct/incorrect
  - No picks submitted
  - Partial picks
- [ ] Test admin analytics accuracy
- [ ] Test role-based access (non-admin cannot access admin panel)

---

### **Task 6.2: User Testing Checklist**
- [ ] Test sport selection (switch between NFL and Six Nations)
- [ ] Test viewing matches by round
- [ ] Test pick submission (all 9 questions)
- [ ] Test validation (must answer all questions)
- [ ] Test locked picks (cannot edit)
- [ ] Test countdown timer accuracy
- [ ] Test leaderboard display (round and overall)
- [ ] Test "My Picks" view
- [ ] Test mobile responsiveness
- [ ] Test error handling (API failures)

---

### **Task 6.3: Edge Cases & Bug Fixes**
- [ ] Match postponement handling
- [ ] Incorrect correct answer (admin override)
- [ ] Duplicate picks prevention
- [ ] Late submissions (after lock)
- [ ] API timeout handling
- [ ] Concurrent admin edits
- [ ] Database transaction failures
- [ ] Large user base (1000+ users)

---

### **Task 6.4: Performance Optimization**
- [ ] Optimize database queries (add indexes)
- [ ] Implement caching for matches/questions
- [ ] Lazy load leaderboard data
- [ ] Optimize frontend bundle size
- [ ] Add loading states for async operations

---

### **Task 6.5: UI/UX Polish**
- [ ] Add Six Nations branding (colors, logos, icons)
- [ ] Create onboarding guide for new users
- [ ] Add tooltips explaining question types
- [ ] Improve mobile layout
- [ ] Add animations and transitions
- [ ] Add empty states (no picks yet, no matches)
- [ ] Add success/error toast messages
- [ ] Add loading skeletons

---

## 🚀 **PHASE 7: LAUNCH PREP (Week 10)**

### **Task 7.1: Pre-Launch Setup**
- [ ] Create all 15 Six Nations matches for 2026 tournament
- [ ] Create 45 questions (3 per match) with template text
- [ ] Create answer options for all questions
- [ ] Test scoring with dummy data
- [ ] Set up cron job for auto-locking
- [ ] Configure admin users (assign admin role)
- [ ] Create public announcement
- [ ] Write user guide/FAQ

---

### **Task 7.2: Deployment**
- [ ] Deploy backend with new schema
- [ ] Run database migrations on production
- [ ] Deploy frontend with Six Nations UI
- [ ] Test on production environment
- [ ] Monitor error logs
- [ ] Set up admin alerts

---

### **Task 7.3: Soft Launch**
- [ ] Invite beta users (10-20 users)
- [ ] Monitor pick submissions
- [ ] Test scoring in real-time
- [ ] Gather feedback
- [ ] Fix critical bugs
- [ ] Prepare for full launch

---

### **Task 7.4: Full Launch**
- [ ] Open to all users
- [ ] Announce on social media
- [ ] Send email to existing users
- [ ] Monitor server performance
- [ ] Respond to user issues
- [ ] Daily check-ins on admin panel

---

## 📊 **SUMMARY: TASK COUNT BY PHASE**

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Frontend Foundation | 35 tasks | 2 weeks |
| Phase 2: Database & Backend | 40 tasks | 2 weeks |
| Phase 3: Admin Panel | 30 tasks | 2 weeks |
| Phase 4: User Pick Flow | 15 tasks | 1 week |
| Phase 5: Leaderboard & Scoring | 10 tasks | 1 week |
| Phase 6: Testing & Polish | 20 tasks | 1 week |
| Phase 7: Launch Prep | 12 tasks | 1 week |
| **TOTAL** | **162 tasks** | **10 weeks** |

---

## 🎯 **CRITICAL PATH (MVP Must-Haves)**

### **Minimum Viable Product (MVP) - 8 Weeks**
1. ✅ Sport selection UI (NFL vs Six Nations)
2. ✅ Database schema for Six Nations
3. ✅ Admin panel for creating matches, questions, answers
4. ✅ Admin ability to set correct answers
5. ✅ User pick submission flow (9 questions per round)
6. ✅ Pick locking 24h before kickoff
7. ✅ Scoring logic (award points based on correct answers)
8. ✅ Leaderboard (round and overall)

### **Post-MVP Enhancements**
- League/squad integration
- Confidence points
- Push notifications
- Advanced analytics
- Social sharing
- Historical archives

---

## 📝 **OPEN DECISIONS NEEDED**

1. **Admin Access:** Who gets admin role? Manual assignment or self-service?
2. **Point Weighting:** Start with all answers = 1 point or allow custom weights from day 1?
3. **Leagues:** Same squads as NFL or separate Six Nations leagues?
4. **Stripe Integration:** Enable payments for Six Nations or keep free?
5. **Missed Picks:** Zero points or partial credit (0.5 points)?
6. **Lock Time:** Exactly 24h before or flexible (48h, 72h)?
7. **Launch Date:** Six Nations 2026 starts February 1, 2026 → Launch by January 15, 2026?

---

**Last Updated:** 2025-11-20
**Status:** Planning Complete - Ready to Start Phase 1
**Total Tasks:** 162
**Estimated Timeline:** 10 weeks (MVP in 8 weeks)
