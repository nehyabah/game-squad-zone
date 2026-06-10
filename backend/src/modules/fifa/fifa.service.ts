import { PrismaClient } from "@prisma/client";

// Fixed round definitions — seeded once on startup
export const FIFA_ROUND_SEEDS = [
  { roundNumber: 0, name: "Tournament Predictions", pointsPerQuestion: 15 },
  { roundNumber: 1, name: "Group Stage",            pointsPerQuestion: 2  },
  { roundNumber: 2, name: "Round of 32",            pointsPerQuestion: 3  },
  { roundNumber: 3, name: "Round of 16",            pointsPerQuestion: 4  },
  { roundNumber: 4, name: "Quarter Finals",         pointsPerQuestion: 5  },
  { roundNumber: 5, name: "Semi Finals",            pointsPerQuestion: 6  },
  { roundNumber: 6, name: "Final",                  pointsPerQuestion: 7  },
];

export class FifaService {
  constructor(private prisma: PrismaClient) {}

  // ── Seeding ──────────────────────────────────────────────────────────
  // Called once on app startup — creates all 7 rounds if they don't exist yet

  async seedRounds() {
    for (const seed of FIFA_ROUND_SEEDS) {
      await this.prisma.fifaRound.upsert({
        where: { roundNumber: seed.roundNumber },
        update: {},
        create: {
          roundNumber: seed.roundNumber,
          name: seed.name,
          pointsPerQuestion: seed.pointsPerQuestion,
          isActive: false,
          isLocked: false,
        },
      });
    }
  }

  // ── Rounds ───────────────────────────────────────────────────────────
  // Admin can only edit name and lockTime — no create/delete

  async getAllRounds() {
    return this.prisma.fifaRound.findMany({
      orderBy: { roundNumber: "asc" },
      include: {
        _count: { select: { matches: true, questions: true } },
      },
    });
  }

  async updateRound(id: string, data: { name?: string; lockTime?: string | null }) {
    return this.prisma.fifaRound.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.lockTime !== undefined && {
          lockTime: data.lockTime ? new Date(data.lockTime) : null,
        }),
      },
    });
  }

  async activateRound(id: string) {
    // Multiple rounds can be active at once (e.g. Round 0 + Round 1 open simultaneously)
    return this.prisma.fifaRound.update({ where: { id }, data: { isActive: true } });
  }

  async deactivateRound(id: string) {
    return this.prisma.fifaRound.update({ where: { id }, data: { isActive: false } });
  }

  async lockRound(id: string) {
    return this.prisma.fifaRound.update({ where: { id }, data: { isLocked: true } });
  }

  async unlockRound(id: string) {
    return this.prisma.fifaRound.update({ where: { id }, data: { isLocked: false } });
  }

  // ── Matches (Round 2–6 only) ─────────────────────────────────────────

  async getAllMatchesAdmin() {
    return this.prisma.fifaMatch.findMany({
      orderBy: [{ round: { roundNumber: "asc" } }, { matchNumber: "asc" }],
      include: { round: true, _count: { select: { questions: true } } },
    });
  }

  async getAllMatches(roundId?: string) {
    const where: any = { round: { roundNumber: { gte: 2 } } };
    if (roundId) {
      where.roundId = roundId;
    } else {
      where.round.isActive = true;
    }
    return this.prisma.fifaMatch.findMany({
      where,
      orderBy: [{ round: { roundNumber: "asc" } }, { matchNumber: "asc" }],
      include: { round: true, _count: { select: { questions: true } } },
    });
  }

  async createMatch(data: {
    roundId: string;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    venue?: string;
    groupTeams?: string[];
  }) {
    const round = await this.prisma.fifaRound.findUnique({ where: { id: data.roundId } });
    if (!round) throw new Error("Round not found.");
    if (round.roundNumber < 2) throw new Error("Matches are only for Rounds 2–6. Use the Questions tab for Rounds 0 and 1.");

    if (!data.homeTeam?.trim()) throw new Error("Home team is required.");
    if (!data.awayTeam?.trim()) throw new Error("Away team is required.");
    if (!data.matchDate) throw new Error("Match date is required.");

    return this.prisma.fifaMatch.create({
      data: {
        roundId: data.roundId,
        matchNumber: data.matchNumber,
        homeTeam: data.homeTeam.trim(),
        awayTeam: data.awayTeam.trim(),
        matchDate: new Date(data.matchDate),
        venue: data.venue?.trim() || null,
        groupTeams: data.groupTeams ? (data.groupTeams as any) : null,
        homeScore: null,
        awayScore: null,
        completed: false,
      },
      include: { round: true },
    });
  }

  async updateMatch(id: string, data: {
    matchNumber?: number;
    homeTeam?: string;
    awayTeam?: string;
    matchDate?: string;
    venue?: string;
  }) {
    return this.prisma.fifaMatch.update({
      where: { id },
      data: {
        ...(data.matchNumber !== undefined && { matchNumber: data.matchNumber }),
        ...(data.homeTeam !== undefined && { homeTeam: data.homeTeam.trim() }),
        ...(data.awayTeam !== undefined && { awayTeam: data.awayTeam.trim() }),
        ...(data.matchDate !== undefined && { matchDate: new Date(data.matchDate) }),
        ...(data.venue !== undefined && { venue: data.venue.trim() || null }),
      },
      include: { round: true },
    });
  }

  async deleteMatch(id: string) {
    await this.prisma.fifaQuestion.deleteMany({ where: { matchId: id } });
    return this.prisma.fifaMatch.delete({ where: { id } });
  }

  async updateMatchScore(id: string, homeScore: number, awayScore: number, performedBy: string) {
    const old = await this.prisma.fifaMatch.findUnique({
      where: { id },
      select: { homeScore: true, awayScore: true, homeTeam: true, awayTeam: true },
    });

    const match = await this.prisma.fifaMatch.update({
      where: { id },
      data: { homeScore, awayScore, completed: true },
      include: { round: true },
    });

    await this.prisma.fifaAuditLog.create({
      data: {
        action: "update_match_score",
        performedBy,
        targetType: "match",
        targetId: id,
        details: {
          homeTeam: old?.homeTeam,
          awayTeam: old?.awayTeam,
          oldHomeScore: old?.homeScore,
          oldAwayScore: old?.awayScore,
          newHomeScore: homeScore,
          newAwayScore: awayScore,
        },
      },
    });

    return match;
  }

  // ── Questions ────────────────────────────────────────────────────────
  // Round 0/1: roundId set, matchId null
  // Round 2-6: matchId set, roundId null

  async getAllQuestionsAdmin() {
    const [roundQuestions, matchQuestions] = await Promise.all([
      this.prisma.fifaQuestion.findMany({
        where: { roundId: { not: null } },
        orderBy: [{ round: { roundNumber: "asc" } }, { questionNumber: "asc" }],
        include: { round: true },
      }),
      this.prisma.fifaQuestion.findMany({
        where: { matchId: { not: null } },
        orderBy: [
          { match: { round: { roundNumber: "asc" } } },
          { match: { matchNumber: "asc" } },
          { questionNumber: "asc" },
        ],
        include: { match: { include: { round: true } } },
      }),
    ]);
    return [...roundQuestions, ...matchQuestions];
  }

  async getAllQuestions(roundId?: string) {
    // If a specific roundId is given use it; otherwise fall back to active rounds
    let targetRoundIds: string[];

    if (roundId) {
      targetRoundIds = [roundId];
    } else {
      const activeRounds = await this.prisma.fifaRound.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      targetRoundIds = activeRounds.map((r) => r.id);
    }

    if (targetRoundIds.length === 0) return [];

    const matches = await this.prisma.fifaMatch.findMany({
      where: { roundId: { in: targetRoundIds } },
      select: { id: true },
    });
    const matchIds = matches.map((m) => m.id);

    const [roundQuestions, matchQuestions] = await Promise.all([
      this.prisma.fifaQuestion.findMany({
        where: { roundId: { in: targetRoundIds } },
        orderBy: [{ round: { roundNumber: "asc" } }, { questionNumber: "asc" }],
        include: { round: true },
      }),
      this.prisma.fifaQuestion.findMany({
        where: { matchId: { in: matchIds } },
        orderBy: [
          { match: { round: { roundNumber: "asc" } } },
          { match: { matchNumber: "asc" } },
          { questionNumber: "asc" },
        ],
        include: { match: { include: { round: true } } },
      }),
    ]);
    return [...roundQuestions, ...matchQuestions];
  }

  private validateOptions(options: string[] | undefined | null): void {
    if (!options || options.length === 0) return;
    const unique = new Set(options.map((o) => o.trim().toLowerCase()));
    if (unique.size !== options.length) throw new Error("Duplicate answer options are not allowed.");
    if (options.some((o) => !o || o.trim() === "")) throw new Error("Empty answer options are not allowed.");
  }

  async createQuestion(data: {
    roundId?: string;
    matchId?: string;
    questionNumber: number;
    questionText: string;
    questionType: string;
    options?: string[];
    contextTeams?: string[];
    points: number;
  }) {
    if (!data.roundId && !data.matchId) throw new Error("Either roundId or matchId is required.");
    if (!data.questionText?.trim()) throw new Error("Question text is required.");

    if (data.questionType === "multiple_choice" && (!data.options || data.options.length === 0)) {
      throw new Error("Multiple choice questions must have at least one option.");
    }
    this.validateOptions(data.options);
    const finalOptions = data.questionType === "multiple_choice" ? (data.options ?? null) : null;

    return this.prisma.fifaQuestion.create({
      data: {
        roundId: data.roundId ?? null,
        matchId: data.matchId ?? null,
        questionNumber: data.questionNumber,
        questionText: data.questionText.trim(),
        questionType: data.questionType,
        options: finalOptions,
        contextTeams: data.contextTeams?.length ? data.contextTeams : null,
        points: data.points,
        correctAnswer: null,
      },
      include: {
        round: true,
        match: { include: { round: true } },
      },
    });
  }

  async updateQuestion(id: string, data: {
    questionNumber?: number;
    questionText?: string;
    questionType?: string;
    options?: string[];
    contextTeams?: string[] | null;
    points?: number;
  }) {
    const existing = await this.prisma.fifaQuestion.findUnique({ where: { id } });
    if (!existing) throw new Error("Question not found.");

    const finalType = data.questionType ?? existing.questionType;
    if (data.options !== undefined) this.validateOptions(data.options);

    let finalOptions: string[] | null | undefined = undefined;
    if (data.options !== undefined) {
      finalOptions = finalType === "multiple_choice" ? (data.options ?? null) : null;
    }

    return this.prisma.fifaQuestion.update({
      where: { id },
      data: {
        ...(data.questionNumber !== undefined && { questionNumber: data.questionNumber }),
        ...(data.questionText !== undefined && { questionText: data.questionText.trim() }),
        ...(data.questionType !== undefined && { questionType: data.questionType }),
        ...(finalOptions !== undefined && { options: finalOptions }),
        ...(data.contextTeams !== undefined && { contextTeams: data.contextTeams?.length ? data.contextTeams : null }),
        ...(data.points !== undefined && { points: data.points }),
      },
      include: { round: true, match: { include: { round: true } } },
    });
  }

  async deleteQuestion(id: string) {
    await this.prisma.fifaAnswer.deleteMany({ where: { questionId: id } });
    return this.prisma.fifaQuestion.delete({ where: { id } });
  }

  async setCorrectAnswer(id: string, correctAnswer: string, performedBy: string) {
    const question = await this.prisma.fifaQuestion.update({
      where: { id },
      data: { correctAnswer },
      include: { round: true, match: { include: { round: true } } },
    });

    await this.calculateAnswerResults(id, correctAnswer);

    await this.prisma.fifaAuditLog.create({
      data: {
        action: "set_correct_answer",
        performedBy,
        targetType: "question",
        targetId: id,
        details: { questionText: question.questionText, correctAnswer },
      },
    });

    return question;
  }

  async clearCorrectAnswer(id: string, performedBy: string) {
    const old = await this.prisma.fifaQuestion.findUnique({ where: { id }, select: { correctAnswer: true, questionText: true } });

    const question = await this.prisma.fifaQuestion.update({
      where: { id },
      data: { correctAnswer: null },
      include: { round: true, match: { include: { round: true } } },
    });

    await this.prisma.fifaAnswer.updateMany({ where: { questionId: id }, data: { isCorrect: null } });

    await this.prisma.fifaAuditLog.create({
      data: {
        action: "clear_correct_answer",
        performedBy,
        targetType: "question",
        targetId: id,
        details: { questionText: old?.questionText, oldCorrectAnswer: old?.correctAnswer },
      },
    });

    return question;
  }

  private async calculateAnswerResults(questionId: string, correctAnswer: string) {
    const answers = await this.prisma.fifaAnswer.findMany({ where: { questionId } });
    for (const answer of answers) {
      await this.prisma.fifaAnswer.update({
        where: { id: answer.id },
        data: { isCorrect: answer.answer === correctAnswer },
      });
    }
  }

  // ── Answers ──────────────────────────────────────────────────────────
  // Locking is round-level: checks round.isLocked OR lockTime has passed

  private async getRoundForQuestion(questionId: string) {
    const q = await this.prisma.fifaQuestion.findUnique({
      where: { id: questionId },
      include: { round: true, match: { include: { round: true } } },
    });
    return q?.round ?? q?.match?.round ?? null;
  }

  async submitAnswers(userId: string, answers: { questionId: string; answer: string }[]) {
    const now = new Date();
    const questionIds = answers.map((a) => a.questionId);

    const questions = await this.prisma.fifaQuestion.findMany({
      where: { id: { in: questionIds } },
      include: { round: true, match: { include: { round: true } } },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));

    const allowed: { questionId: string; answer: string }[] = [];
    const locked: { questionId: string; answer: string; roundName: string }[] = [];

    for (const { questionId, answer } of answers) {
      const q = qMap.get(questionId);
      if (!q) continue;
      const round = q.round ?? q.match?.round;
      if (!round) continue;

      const isLocked = round.isLocked || (round.lockTime != null && now >= new Date(round.lockTime));
      if (isLocked) {
        locked.push({ questionId, answer, roundName: round.name });
      } else {
        allowed.push({ questionId, answer });
      }
    }

    for (const l of locked) {
      await this.prisma.fifaAuditLog.create({
        data: {
          action: "answer_rejected_locked",
          performedBy: userId,
          targetType: "answer",
          targetId: l.questionId,
          details: { questionId: l.questionId, answer: l.answer, roundName: l.roundName, submittedAt: now.toISOString() },
        },
      });
    }

    if (allowed.length === 0 && locked.length > 0) {
      throw new Error("All answers rejected: round is locked.");
    }

    let saved: any[] = [];
    if (allowed.length > 0) {
      saved = await this.prisma.$transaction(
        allowed.map(({ questionId, answer }) =>
          this.prisma.fifaAnswer.upsert({
            where: { questionId_userId: { questionId, userId } },
            update: { answer },
            create: { questionId, userId, answer, isCorrect: null },
          })
        )
      );

      for (const s of saved) {
        await this.prisma.fifaAuditLog.create({
          data: {
            action: "answer_submitted",
            performedBy: userId,
            targetType: "answer",
            targetId: s.id,
            details: { questionId: s.questionId, answer: s.answer, submittedAt: now.toISOString() },
          },
        });
      }
    }

    if (locked.length > 0) {
      return {
        saved,
        locked: locked.map((l) => ({ questionId: l.questionId, reason: `${l.roundName} is locked` })),
        message: `${saved.length} answer(s) saved, ${locked.length} rejected (round locked)`,
      };
    }
    return saved;
  }

  // Fetch another user's answers — only for rounds that are already locked (visibility guard)
  async getSpecificUserAnswers(targetUserId: string, roundId?: string) {
    const now = new Date();
    const answers = await this.prisma.fifaAnswer.findMany({
      where: { userId: targetUserId },
      include: {
        question: {
          include: {
            round: true,
            match: { include: { round: true } },
          },
        },
      },
      orderBy: [
        { question: { round: { roundNumber: "asc" } } },
        { question: { questionNumber: "asc" } },
      ],
    });

    const byRound = roundId
      ? answers.filter((a) => {
          const r = a.question.round ?? a.question.match?.round;
          return r?.id === roundId;
        })
      : answers;

    // Only show picks for rounds that are locked — prevents seeing live picks
    return byRound.filter((a) => {
      const r = a.question.round ?? a.question.match?.round;
      if (!r) return false;
      return r.isLocked || (r.lockTime != null && now >= new Date(r.lockTime));
    });
  }

  async getUserAnswers(userId: string, roundId?: string) {
    // Resolve which round IDs to filter by
    let targetRoundIds: string[];

    if (roundId) {
      targetRoundIds = [roundId];
    } else {
      const activeRounds = await this.prisma.fifaRound.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      targetRoundIds = activeRounds.map((r) => r.id);
    }

    if (targetRoundIds.length === 0) return [];

    // Get match IDs that belong to the target rounds
    const matches = await this.prisma.fifaMatch.findMany({
      where: { roundId: { in: targetRoundIds } },
      select: { id: true },
    });
    const matchIds = matches.map((m) => m.id);

    return this.prisma.fifaAnswer.findMany({
      where: {
        userId,
        question: {
          OR: [
            { roundId: { in: targetRoundIds } },
            { matchId: { in: matchIds } },
          ],
        },
      },
      include: {
        question: {
          include: {
            round: true,
            match: { include: { round: true } },
          },
        },
      },
    });
  }

  // ── Leaderboard ──────────────────────────────────────────────────────

  async getLeaderboard(roundId?: string, scope?: string) {
    const whereClause: any = {};
    if (scope === "total") {
      // no filter
    } else if (roundId) {
      whereClause.question = { OR: [{ roundId }, { match: { roundId } }] };
    } else {
      whereClause.question = {
        OR: [
          { round: { isActive: true } },
          { match: { round: { isActive: true } } },
        ],
      };
    }

    const answers = await this.prisma.fifaAnswer.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true } },
        question: true,
      },
    });

    const userScores = new Map<string, { user: any; totalPoints: number; correctAnswers: number; incorrectAnswers: number; totalAnswers: number }>();
    for (const answer of answers) {
      const existing = userScores.get(answer.userId) || { user: answer.user, totalPoints: 0, correctAnswers: 0, incorrectAnswers: 0, totalAnswers: 0 };
      existing.totalAnswers += 1;
      if (answer.isCorrect === true) { existing.totalPoints += answer.question.points; existing.correctAnswers += 1; }
      else if (answer.isCorrect === false) { existing.incorrectAnswers += 1; }
      userScores.set(answer.userId, existing);
    }

    const sorted = Array.from(userScores.values())
      .sort((a, b) => b.totalPoints !== a.totalPoints ? b.totalPoints - a.totalPoints : b.correctAnswers - a.correctAnswers);

    const leader = sorted[0]?.totalPoints ?? 0;

    return sorted.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      distanceToLeader: leader - entry.totalPoints,
    }));
  }

  async getUserRoundBreakdown(userId: string) {
    const answers = await this.prisma.fifaAnswer.findMany({
      where: { userId },
      include: {
        question: {
          include: { round: true, match: { include: { round: true } } },
        },
      },
    });

    const roundMap = new Map<number, { roundNumber: number; roundName: string; points: number; correct: number; incorrect: number; total: number }>();
    for (const answer of answers) {
      const round = answer.question.round ?? answer.question.match?.round;
      if (!round) continue;
      const existing = roundMap.get(round.roundNumber) || { roundNumber: round.roundNumber, roundName: round.name, points: 0, correct: 0, incorrect: 0, total: 0 };
      existing.total += 1;
      if (answer.isCorrect === true) { existing.points += answer.question.points; existing.correct += 1; }
      else if (answer.isCorrect === false) { existing.incorrect += 1; }
      roundMap.set(round.roundNumber, existing);
    }

    return Array.from(roundMap.values()).sort((a, b) => a.roundNumber - b.roundNumber);
  }

  // ── Audit Log ────────────────────────────────────────────────────────

  async getAuditLog(filters?: { action?: string; limit?: number }) {
    const entries = await this.prisma.fifaAuditLog.findMany({
      where: filters?.action ? { action: filters.action } : {},
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 200,
    });

    const userIds = [...new Set(entries.map((e) => e.performedBy))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return entries.map((e) => ({ ...e, performedByUser: userMap.get(e.performedBy) || null }));
  }
}
