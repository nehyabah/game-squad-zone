// src/modules/six-nations/six-nations.service.ts
import { PrismaClient } from "@prisma/client";
import { SixNationsVisibilityService } from "../../services/six-nations-visibility.service";

export class SixNationsService {
  private visibilityService: SixNationsVisibilityService;

  constructor(private prisma: PrismaClient) {
    this.visibilityService = new SixNationsVisibilityService();
  }

  // Helper method to check for duplicate options
  private hasDuplicateOptions(options: string[]): boolean {
    const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
    return uniqueOptions.size !== options.length;
  }

  // Helper method to validate options
  private validateOptions(options: string[] | undefined | null, questionType: string): void {
    if (!options || options.length === 0) {
      return; // No options to validate (e.g., yes/no questions)
    }

    // Check for duplicates (case-insensitive, ignoring whitespace)
    if (this.hasDuplicateOptions(options)) {
      throw new Error('Duplicate answer options are not allowed. Each option must be unique.');
    }

    // Check for empty options
    if (options.some(opt => !opt || opt.trim() === '')) {
      throw new Error('Empty answer options are not allowed.');
    }
  }

  // Helper method to ensure "None of the above" is included for multiple choice questions
  private ensureNoneOfTheAboveOption(options: string[] | undefined | null, questionType: string): string[] | null {
    // Only apply to multiple_choice questions
    if (questionType !== 'multiple_choice') {
      return options || null;
    }

    // If no options provided, return null (will be validated separately)
    if (!options || options.length === 0) {
      return null;
    }

    const noneOfTheAbove = 'None of the above';

    // Check if "None of the above" already exists (case-insensitive)
    const hasNoneOfTheAbove = options.some(
      opt => opt.trim().toLowerCase() === noneOfTheAbove.toLowerCase()
    );

    // If it doesn't exist, add it at the end
    if (!hasNoneOfTheAbove) {
      return [...options, noneOfTheAbove];
    }

    // If it exists, make sure it's at the end
    const filteredOptions = options.filter(
      opt => opt.trim().toLowerCase() !== noneOfTheAbove.toLowerCase()
    );
    return [...filteredOptions, noneOfTheAbove];
  }

  // Rounds
  async getAllRounds() {
    return this.prisma.sixNationsRound.findMany({
      orderBy: { roundNumber: 'asc' },
      include: {
        _count: {
          select: { matches: true }
        }
      }
    });
  }

  async createRound(data: {
    roundNumber: number;
    name: string;
    startDate: string;
    endDate: string;
  }) {
    return this.prisma.sixNationsRound.create({
      data: {
        roundNumber: data.roundNumber,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: false,
      },
    });
  }

  async updateRound(id: string, data: {
    roundNumber?: number;
    name?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.prisma.sixNationsRound.update({
      where: { id },
      data: {
        ...(data.roundNumber !== undefined && { roundNumber: data.roundNumber }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      },
    });
  }

  async deleteRound(id: string) {
    // Delete all related matches and questions first
    await this.prisma.sixNationsMatch.deleteMany({
      where: { roundId: id },
    });

    return this.prisma.sixNationsRound.delete({
      where: { id },
    });
  }

  async activateRound(id: string) {
    // Deactivate all other rounds first
    await this.prisma.sixNationsRound.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the specified round
    return this.prisma.sixNationsRound.update({
      where: { id },
      data: { isActive: true },
    });
  }

  // Matches
  async getAllMatches() {
    // Only return matches from the active round (for players)
    return this.prisma.sixNationsMatch.findMany({
      where: {
        round: {
          isActive: true
        }
      },
      orderBy: [
        { round: { roundNumber: 'asc' } },
        { matchNumber: 'asc' }
      ],
      include: {
        round: true,
        _count: {
          select: { questions: true }
        }
      },
    });
  }

  // Admin: Get ALL matches regardless of round status
  async getAllMatchesAdmin() {
    return this.prisma.sixNationsMatch.findMany({
      orderBy: [
        { round: { roundNumber: 'asc' } },
        { matchNumber: 'asc' }
      ],
      include: {
        round: true,
        _count: {
          select: { questions: true }
        }
      },
    });
  }

  async createMatch(data: {
    roundId: string;
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    matchDate: string;
    venue?: string;
  }) {
    // Check if round exists
    const round = await this.prisma.sixNationsRound.findUnique({
      where: { id: data.roundId },
    });

    if (!round) {
      throw new Error(`Round with ID ${data.roundId} does not exist. Please create the round first.`);
    }

    return this.prisma.sixNationsMatch.create({
      data: {
        roundId: data.roundId,
        matchNumber: data.matchNumber,
        homeTeam: data.homeTeam,
        awayTeam: data.awayTeam,
        matchDate: new Date(data.matchDate),
        venue: data.venue,
        homeScore: null,
        awayScore: null,
        completed: false,
      },
      include: {
        round: true,
      },
    });
  }

  async updateMatch(id: string, data: {
    matchNumber?: number;
    homeTeam?: string;
    awayTeam?: string;
    matchDate?: string;
    venue?: string;
  }) {
    return this.prisma.sixNationsMatch.update({
      where: { id },
      data: {
        ...(data.matchNumber !== undefined && { matchNumber: data.matchNumber }),
        ...(data.homeTeam !== undefined && { homeTeam: data.homeTeam }),
        ...(data.awayTeam !== undefined && { awayTeam: data.awayTeam }),
        ...(data.matchDate !== undefined && { matchDate: new Date(data.matchDate) }),
        ...(data.venue !== undefined && { venue: data.venue }),
      },
      include: {
        round: true,
      },
    });
  }

  async deleteMatch(id: string) {
    // Delete all related questions first
    await this.prisma.sixNationsQuestion.deleteMany({
      where: { matchId: id },
    });

    return this.prisma.sixNationsMatch.delete({
      where: { id },
    });
  }

  async updateMatchScore(id: string, homeScore: number, awayScore: number, performedBy: string) {
    // Fetch old values for audit log
    const oldMatch = await this.prisma.sixNationsMatch.findUnique({
      where: { id },
      select: { homeScore: true, awayScore: true, homeTeam: true, awayTeam: true },
    });

    const match = await this.prisma.sixNationsMatch.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        completed: true,
      },
      include: {
        round: true,
      },
    });

    await this.prisma.sixNationsAuditLog.create({
      data: {
        action: 'update_match_score',
        performedBy,
        targetType: 'match',
        targetId: id,
        details: {
          homeTeam: oldMatch?.homeTeam,
          awayTeam: oldMatch?.awayTeam,
          oldHomeScore: oldMatch?.homeScore,
          oldAwayScore: oldMatch?.awayScore,
          newHomeScore: homeScore,
          newAwayScore: awayScore,
        },
      },
    });

    return match;
  }

  // Questions
  async getAllQuestions() {
    // Only return questions from matches in the active round (for players)
    return this.prisma.sixNationsQuestion.findMany({
      where: {
        match: {
          round: {
            isActive: true
          }
        }
      },
      orderBy: [
        { match: { round: { roundNumber: 'asc' } } },
        { match: { matchNumber: 'asc' } },
        { questionNumber: 'asc' }
      ],
      include: {
        match: {
          include: {
            round: true,
          },
        },
      },
    });
  }

  // Admin: Get ALL questions regardless of round status
  async getAllQuestionsAdmin() {
    return this.prisma.sixNationsQuestion.findMany({
      orderBy: [
        { match: { round: { roundNumber: 'asc' } } },
        { match: { matchNumber: 'asc' } },
        { questionNumber: 'asc' }
      ],
      include: {
        match: {
          include: {
            round: true,
          },
        },
      },
    });
  }

  async createQuestion(data: {
    matchId: string;
    questionNumber: number;
    questionText: string;
    questionType: string;
    options?: string[];
    points: number;
  }) {
    // Validate options for duplicates
    this.validateOptions(data.options, data.questionType);

    // Ensure "None of the above" is included for multiple choice questions
    const finalOptions = this.ensureNoneOfTheAboveOption(data.options, data.questionType);

    return this.prisma.sixNationsQuestion.upsert({
      where: {
        matchId_questionNumber: {
          matchId: data.matchId,
          questionNumber: data.questionNumber,
        },
      },
      update: {
        questionText: data.questionText,
        questionType: data.questionType,
        options: finalOptions,
        points: data.points,
      },
      create: {
        matchId: data.matchId,
        questionNumber: data.questionNumber,
        questionText: data.questionText,
        questionType: data.questionType,
        options: finalOptions,
        points: data.points,
        correctAnswer: null,
      },
      include: {
        match: {
          include: {
            round: true,
          },
        },
      },
    });
  }

  async updateQuestion(id: string, data: {
    questionNumber?: number;
    questionText?: string;
    questionType?: string;
    options?: string[];
    points?: number;
    correctAnswer?: string | null;
  }) {
    // Get existing question to check questionType
    const existingQuestion = await this.prisma.sixNationsQuestion.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      throw new Error('Question not found');
    }

    // Determine the final question type (new or existing)
    const finalQuestionType = data.questionType !== undefined ? data.questionType : existingQuestion.questionType;

    // Validate options for duplicates if options are being updated
    if (data.options !== undefined) {
      this.validateOptions(data.options, finalQuestionType);
    }

    // Determine final options with "None of the above" if applicable
    let finalOptions: string[] | null | undefined = undefined;
    if (data.options !== undefined) {
      // Options are being updated - ensure "None of the above" is included
      finalOptions = this.ensureNoneOfTheAboveOption(data.options, finalQuestionType);
    } else if (data.questionType !== undefined && data.questionType !== existingQuestion.questionType) {
      // Question type is changing but options are not provided
      // Need to adjust existing options for the new type
      const existingOptions = existingQuestion.options as string[] | null;
      finalOptions = this.ensureNoneOfTheAboveOption(existingOptions, finalQuestionType);
    }

    // Check if correctAnswer is being updated
    const isCorrectAnswerChanging = data.correctAnswer !== undefined;

    // Update the question
    const question = await this.prisma.sixNationsQuestion.update({
      where: { id },
      data: {
        ...(data.questionNumber !== undefined && { questionNumber: data.questionNumber }),
        ...(data.questionText !== undefined && { questionText: data.questionText }),
        ...(data.questionType !== undefined && { questionType: data.questionType }),
        ...(finalOptions !== undefined && { options: finalOptions }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
      },
      include: {
        match: {
          include: {
            round: true,
          },
        },
      },
    });

    // If correctAnswer was updated, recalculate all user answers
    if (isCorrectAnswerChanging) {
      if (data.correctAnswer) {
        // Recalculate with new correct answer
        await this.calculateAnswerResults(id, data.correctAnswer);
      } else {
        // Clear all isCorrect values (set to null) when correct answer is removed
        await this.prisma.sixNationsAnswer.updateMany({
          where: { questionId: id },
          data: { isCorrect: null },
        });
      }
    }

    return question;
  }

  async deleteQuestion(id: string) {
    // Delete all related answers first
    await this.prisma.sixNationsAnswer.deleteMany({
      where: { questionId: id },
    });

    return this.prisma.sixNationsQuestion.delete({
      where: { id },
    });
  }

  async setCorrectAnswer(id: string, correctAnswer: string, performedBy: string) {
    // Update the question with correct answer
    const question = await this.prisma.sixNationsQuestion.update({
      where: { id },
      data: { correctAnswer },
      include: {
        match: {
          include: {
            round: true,
          },
        },
      },
    });

    // Calculate isCorrect for all answers to this question
    await this.calculateAnswerResults(id, correctAnswer);

    await this.prisma.sixNationsAuditLog.create({
      data: {
        action: 'set_correct_answer',
        performedBy,
        targetType: 'question',
        targetId: id,
        details: {
          questionText: question.questionText,
          correctAnswer,
          matchId: question.matchId,
        },
      },
    });

    return question;
  }

  async clearCorrectAnswer(id: string, performedBy: string) {
    // Fetch old correct answer for audit log
    const oldQuestion = await this.prisma.sixNationsQuestion.findUnique({
      where: { id },
      select: { correctAnswer: true, questionText: true, matchId: true },
    });

    // Update the question to clear the correct answer
    const question = await this.prisma.sixNationsQuestion.update({
      where: { id },
      data: { correctAnswer: null },
      include: {
        match: {
          include: {
            round: true,
          },
        },
      },
    });

    // Clear all isCorrect values for answers to this question
    await this.prisma.sixNationsAnswer.updateMany({
      where: { questionId: id },
      data: { isCorrect: null },
    });

    await this.prisma.sixNationsAuditLog.create({
      data: {
        action: 'clear_correct_answer',
        performedBy,
        targetType: 'question',
        targetId: id,
        details: {
          questionText: oldQuestion?.questionText,
          oldCorrectAnswer: oldQuestion?.correctAnswer,
          matchId: oldQuestion?.matchId,
        },
      },
    });

    return question;
  }

  // Helper method to calculate answer results
  private async calculateAnswerResults(questionId: string, correctAnswer: string) {
    // Get all answers for this question
    const answers = await this.prisma.sixNationsAnswer.findMany({
      where: { questionId },
    });

    // Update each answer with isCorrect status
    for (const answer of answers) {
      await this.prisma.sixNationsAnswer.update({
        where: { id: answer.id },
        data: {
          isCorrect: answer.answer === correctAnswer,
        },
      });
    }
  }

  // Submit user answers
  async submitAnswers(userId: string, answers: { questionId: string; answer: string }[]) {
    const LOCK_HOURS = 1;
    const now = new Date();

    // Fetch all questions with their match dates in one query
    const questionIds = answers.map(a => a.questionId);
    const questions = await this.prisma.sixNationsQuestion.findMany({
      where: { id: { in: questionIds } },
      include: { match: true },
    });

    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Split answers into allowed and locked
    const allowedAnswers: { questionId: string; answer: string }[] = [];
    const lockedAnswers: { questionId: string; answer: string; matchDate: Date; homeTeam: string; awayTeam: string }[] = [];

    for (const { questionId, answer } of answers) {
      const question = questionMap.get(questionId);
      if (!question) continue; // Skip invalid question IDs

      const lockTime = new Date(question.match.matchDate.getTime() - LOCK_HOURS * 60 * 60 * 1000);
      if (now >= lockTime) {
        lockedAnswers.push({
          questionId,
          answer,
          matchDate: question.match.matchDate,
          homeTeam: question.match.homeTeam,
          awayTeam: question.match.awayTeam,
        });
      } else {
        allowedAnswers.push({ questionId, answer });
      }
    }

    // Log locked rejections
    for (const locked of lockedAnswers) {
      await this.prisma.sixNationsAuditLog.create({
        data: {
          action: 'answer_rejected_locked',
          performedBy: userId,
          targetType: 'answer',
          targetId: locked.questionId,
          details: {
            questionId: locked.questionId,
            answer: locked.answer,
            matchDate: locked.matchDate.toISOString(),
            submittedAt: now.toISOString(),
            reason: `Match ${locked.homeTeam} vs ${locked.awayTeam} locks ${LOCK_HOURS}h before kickoff`,
          },
        },
      });
    }

    // If all answers are locked, return error
    if (allowedAnswers.length === 0 && lockedAnswers.length > 0) {
      throw new Error(
        `All answers rejected: matches are locked. ${lockedAnswers.map(l => `${l.homeTeam} vs ${l.awayTeam} (kickoff: ${l.matchDate.toISOString()})`).join('; ')}`
      );
    }

    // Upsert only allowed answers
    let savedAnswers: any[] = [];
    if (allowedAnswers.length > 0) {
      savedAnswers = await this.prisma.$transaction(
        allowedAnswers.map(({ questionId, answer }) =>
          this.prisma.sixNationsAnswer.upsert({
            where: {
              questionId_userId: {
                questionId,
                userId,
              },
            },
            update: { answer },
            create: {
              questionId,
              userId,
              answer,
              isCorrect: null,
            },
            include: {
              question: { include: { match: true } },
            },
          })
        )
      );

      // Log successful submissions
      for (const saved of savedAnswers) {
        await this.prisma.sixNationsAuditLog.create({
          data: {
            action: 'answer_submitted',
            performedBy: userId,
            targetType: 'answer',
            targetId: saved.id,
            details: {
              questionId: saved.questionId,
              matchId: saved.question.matchId,
              answer: saved.answer,
              matchDate: saved.question.match.matchDate.toISOString(),
              submittedAt: now.toISOString(),
            },
          },
        });
      }
    }

    // Return result with info about locked answers if any
    if (lockedAnswers.length > 0) {
      return {
        saved: savedAnswers,
        locked: lockedAnswers.map(l => ({
          questionId: l.questionId,
          reason: `Match ${l.homeTeam} vs ${l.awayTeam} is locked (kickoff: ${l.matchDate.toISOString()})`,
        })),
        message: `${savedAnswers.length} answer(s) saved, ${lockedAnswers.length} rejected (match locked)`,
      };
    }

    return savedAnswers;
  }

  // Get user's answers
  async getUserAnswers(userId: string, roundId?: string) {
    const where: any = { userId };

    if (roundId) {
      // If roundId is specified, filter by that specific round
      where.question = {
        match: {
          roundId,
        },
      };
    } else {
      // If no roundId specified, default to active round only
      where.question = {
        match: {
          round: {
            isActive: true
          }
        },
      };
    }

    return this.prisma.sixNationsAnswer.findMany({
      where,
      include: {
        question: {
          include: {
            match: {
              include: {
                round: true,
              },
            },
          },
        },
      },
      orderBy: [
        { question: { match: { round: { roundNumber: 'asc' } } } },
        { question: { match: { matchNumber: 'asc' } } },
        { question: { questionNumber: 'asc' } },
      ],
    });
  }

  // Get user's answers with visibility filtering (prevents cheating)
  async getUserAnswersWithVisibility(
    targetUserId: string,
    requestingUserId: string,
    roundId?: string
  ) {
    const where: any = { userId: targetUserId };

    if (roundId) {
      // If roundId is specified, filter by that specific round
      where.question = {
        match: {
          roundId,
        },
      };
    } else {
      // If no roundId specified, default to active round only
      where.question = {
        match: {
          round: {
            isActive: true
          }
        },
      };
    }

    // Fetch answers with match details (needed for matchDate visibility check)
    const answers = await this.prisma.sixNationsAnswer.findMany({
      where,
      include: {
        question: {
          include: {
            match: {
              include: {
                round: true,
              },
            },
          },
        },
      },
      orderBy: [
        { question: { match: { round: { roundNumber: 'asc' } } } },
        { question: { match: { matchNumber: 'asc' } } },
        { question: { questionNumber: 'asc' } },
      ],
    });

    // Apply visibility filtering
    return this.visibilityService.filterAnswerArray(answers, requestingUserId);
  }

  // Get leaderboard for Six Nations
  async getLeaderboard(roundId?: string, scope?: string) {
    // Build top-level where clause
    const whereClause: any = {};

    if (scope === 'total') {
      // No filter — aggregate across ALL rounds
    } else if (roundId) {
      whereClause.question = { match: { roundId } };
    } else {
      // Default to active round only
      whereClause.question = { match: { round: { isActive: true } } };
    }

    // Get all answers for the specified scope
    const answers = await this.prisma.sixNationsAnswer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        question: true,
      },
    });

    // Group by user and calculate stats
    const userScores = new Map<string, {
      user: any;
      totalPoints: number;
      correctAnswers: number;
      incorrectAnswers: number;
      totalAnswers: number;
    }>();

    for (const answer of answers) {
      const userId = answer.userId;
      const existing = userScores.get(userId) || {
        user: answer.user,
        totalPoints: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalAnswers: 0,
      };

      existing.totalAnswers += 1;

      if (answer.isCorrect === true) {
        existing.totalPoints += answer.question.points;
        existing.correctAnswers += 1;
      } else if (answer.isCorrect === false) {
        existing.incorrectAnswers += 1;
      }
      // If isCorrect is null, it's still pending

      userScores.set(userId, existing);
    }

    // Convert to array and sort by points (descending), then by correct answers (descending)
    const leaderboard = Array.from(userScores.values())
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.correctAnswers - a.correctAnswers;
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return leaderboard;
  }

  // Admin user management
  async getAdminUsers() {
    // Only return users who are admins
    return this.prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllUsers() {
    // Return all users (for user management)
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSixNationsUsers() {
    // Only return subscribed users who are in a Six Nations squad (for email picker)
    return this.prisma.user.findMany({
      where: {
        emailUnsubscribed: false,
        squadMembers: {
          some: {
            squad: { sport: "six-nations" },
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        displayName: true,
        isAdmin: true,
      },
      orderBy: { username: 'asc' },
    });
  }

  async addAdminByEmail(email: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error(`User with email "${email}" not found`);
    }

    if (user.isAdmin) {
      throw new Error(`User with email "${email}" is already an admin`);
    }

    // Make user admin
    return this.prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
    });
  }

  async toggleUserAdmin(id: string, isAdmin: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isAdmin: true,
      },
    });
  }

  // Audit Log
  async getAuditLog(filters?: { action?: string; performedBy?: string; limit?: number }) {
    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.performedBy) where.performedBy = filters.performedBy;

    const entries = await this.prisma.sixNationsAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 200,
    });

    // Manually join user data since there's no relation defined
    const userIds = [...new Set(entries.map(e => e.performedBy))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return entries.map(entry => ({
      ...entry,
      performedByUser: userMap.get(entry.performedBy) || null,
    }));
  }

  // ── Six Nations Statistics ──────────────────────────────────────

  async getSixNationsSquadStats(squadId: string) {
    // Get all squad members
    const squadMembers = await this.prisma.squadMember.findMany({
      where: { squadId },
      select: { userId: true },
    });
    const memberIds = squadMembers.map(m => m.userId);

    if (memberIds.length === 0) {
      return {
        leader: null,
        squadAccuracy: 0,
        totalCorrect: 0,
        totalAnswered: 0,
        rounds: [],
        bestRound: null,
      };
    }

    // Get all answers for squad members across all rounds
    const answers = await this.prisma.sixNationsAnswer.findMany({
      where: { userId: { in: memberIds } },
      include: {
        question: {
          include: {
            match: { include: { round: true } },
          },
        },
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, displayName: true, avatarUrl: true },
        },
      },
    });

    // Calculate per-user points for squad leader
    const userPoints = new Map<string, { user: any; totalPoints: number }>();
    for (const answer of answers) {
      const existing = userPoints.get(answer.userId) || { user: answer.user, totalPoints: 0 };
      if (answer.isCorrect === true) {
        existing.totalPoints += answer.question.points;
      }
      userPoints.set(answer.userId, existing);
    }

    const leader = Array.from(userPoints.values())
      .sort((a, b) => b.totalPoints - a.totalPoints)[0] || null;

    // Overall squad accuracy
    const scoredAnswers = answers.filter(a => a.isCorrect !== null);
    const correctAnswers = answers.filter(a => a.isCorrect === true);
    const squadAccuracy = scoredAnswers.length > 0
      ? Math.round((correctAnswers.length / scoredAnswers.length) * 100)
      : 0;

    // Per-round breakdown
    const roundMap = new Map<string, { roundName: string; roundNumber: number; totalCorrect: number; totalScored: number }>();
    for (const answer of answers) {
      const round = answer.question.match.round;
      const key = round.id;
      const existing = roundMap.get(key) || { roundName: round.name, roundNumber: round.roundNumber, totalCorrect: 0, totalScored: 0 };
      if (answer.isCorrect !== null) {
        existing.totalScored += 1;
        if (answer.isCorrect === true) {
          existing.totalCorrect += 1;
        }
      }
      roundMap.set(key, existing);
    }

    const rounds = Array.from(roundMap.values())
      .map(r => ({
        ...r,
        accuracy: r.totalScored > 0 ? Math.round((r.totalCorrect / r.totalScored) * 100) : 0,
      }))
      .sort((a, b) => a.roundNumber - b.roundNumber);

    const bestRound = rounds.length > 0
      ? rounds.reduce((best, r) => r.accuracy > best.accuracy ? r : best, rounds[0])
      : null;

    return {
      leader: leader ? { ...leader.user, totalPoints: leader.totalPoints } : null,
      squadAccuracy,
      totalCorrect: correctAnswers.length,
      totalAnswered: scoredAnswers.length,
      rounds,
      bestRound: bestRound ? { roundName: bestRound.roundName, accuracy: bestRound.accuracy } : null,
    };
  }

  async getSixNationsPersonalStats(userId: string, squadId: string) {
    // Verify user is in squad
    const membership = await this.prisma.squadMember.findFirst({
      where: { squadId, userId },
    });
    if (!membership) {
      throw new Error('User is not a member of this squad');
    }

    // Get all answers for this user
    const answers = await this.prisma.sixNationsAnswer.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            match: { include: { round: true } },
          },
        },
      },
      orderBy: [
        { question: { match: { round: { roundNumber: 'asc' } } } },
        { question: { match: { matchNumber: 'asc' } } },
        { question: { questionNumber: 'asc' } },
      ],
    });

    const scoredAnswers = answers.filter(a => a.isCorrect !== null);
    const correctAnswers = answers.filter(a => a.isCorrect === true);
    const incorrectAnswers = answers.filter(a => a.isCorrect === false);
    const pendingAnswers = answers.filter(a => a.isCorrect === null);

    const totalPoints = correctAnswers.reduce((sum, a) => sum + a.question.points, 0);
    const accuracy = scoredAnswers.length > 0
      ? Math.round((correctAnswers.length / scoredAnswers.length) * 100)
      : 0;

    // Per-round breakdown
    const roundMap = new Map<string, {
      roundName: string; roundNumber: number;
      points: number; correct: number; incorrect: number; total: number;
    }>();
    for (const answer of answers) {
      const round = answer.question.match.round;
      const key = round.id;
      const existing = roundMap.get(key) || {
        roundName: round.name, roundNumber: round.roundNumber,
        points: 0, correct: 0, incorrect: 0, total: 0,
      };
      if (answer.isCorrect !== null) {
        existing.total += 1;
        if (answer.isCorrect === true) {
          existing.correct += 1;
          existing.points += answer.question.points;
        } else {
          existing.incorrect += 1;
        }
      }
      roundMap.set(key, existing);
    }

    const rounds = Array.from(roundMap.values())
      .map(r => ({
        ...r,
        accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
      }))
      .sort((a, b) => a.roundNumber - b.roundNumber);

    const scoredRounds = rounds.filter(r => r.total > 0);
    const bestRound = scoredRounds.length > 0
      ? scoredRounds.reduce((best, r) => r.accuracy > best.accuracy ? r : best, scoredRounds[0])
      : null;
    const worstRound = scoredRounds.length > 0
      ? scoredRounds.reduce((worst, r) => r.accuracy < worst.accuracy ? r : worst, scoredRounds[0])
      : null;

    return {
      totalPoints,
      accuracy,
      correct: correctAnswers.length,
      incorrect: incorrectAnswers.length,
      pending: pendingAnswers.length,
      rounds,
      bestRound: bestRound ? { roundName: bestRound.roundName, accuracy: bestRound.accuracy } : null,
      worstRound: worstRound ? { roundName: worstRound.roundName, accuracy: worstRound.accuracy } : null,
    };
  }

  async getSixNationsMemberComparison(member1Id: string, member2Id: string, squadId: string) {
    const [member1Stats, member2Stats] = await Promise.all([
      this.getSixNationsPersonalStats(member1Id, squadId),
      this.getSixNationsPersonalStats(member2Id, squadId),
    ]);

    // Head-to-head: per-round, who scored more points
    const allRoundNames = new Set([
      ...member1Stats.rounds.map(r => r.roundName),
      ...member2Stats.rounds.map(r => r.roundName),
    ]);

    let member1Wins = 0;
    let member2Wins = 0;
    const roundComparison: { roundName: string; member1Points: number; member2Points: number; winner: string | null }[] = [];

    for (const roundName of allRoundNames) {
      const m1Round = member1Stats.rounds.find(r => r.roundName === roundName);
      const m2Round = member2Stats.rounds.find(r => r.roundName === roundName);
      const m1Points = m1Round?.points || 0;
      const m2Points = m2Round?.points || 0;

      let winner: string | null = null;
      if (m1Points > m2Points) {
        member1Wins += 1;
        winner = 'member1';
      } else if (m2Points > m1Points) {
        member2Wins += 1;
        winner = 'member2';
      }

      roundComparison.push({ roundName, member1Points: m1Points, member2Points: m2Points, winner });
    }

    return {
      member1Stats,
      member2Stats,
      headToHead: { member1Wins, member2Wins },
      roundComparison,
    };
  }

  async getSuspiciousActivity() {
    // Find users with rejected-locked answers (attempted to submit after lock)
    const rejections = await this.prisma.sixNationsAuditLog.findMany({
      where: { action: 'answer_rejected_locked' },
      orderBy: { createdAt: 'desc' },
    });

    // Group by user
    const userRejections = new Map<string, { count: number; entries: typeof rejections }>();
    for (const r of rejections) {
      const existing = userRejections.get(r.performedBy) || { count: 0, entries: [] };
      existing.count += 1;
      existing.entries.push(r);
      userRejections.set(r.performedBy, existing);
    }

    // Also detect late submissions: answers submitted very close to lock window
    const lateSubmissions = await this.prisma.sixNationsAuditLog.findMany({
      where: { action: 'answer_submitted' },
      orderBy: { createdAt: 'desc' },
    });

    // Filter for submissions in the last 2 hours before match
    const suspiciousLate: typeof lateSubmissions = [];
    for (const s of lateSubmissions) {
      const details = s.details as any;
      if (details?.matchDate && details?.submittedAt) {
        const matchDate = new Date(details.matchDate);
        const submittedAt = new Date(details.submittedAt);
        const hoursBeforeMatch = (matchDate.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
        // Flag submissions within 2 hours of match (but still before the 1-hour lock)
        if (hoursBeforeMatch > 0 && hoursBeforeMatch <= 2) {
          suspiciousLate.push(s);
        }
      }
    }

    // Enrich with user info
    const allUserIds = [...new Set([
      ...rejections.map(r => r.performedBy),
      ...suspiciousLate.map(s => s.performedBy),
    ])];
    const users = await this.prisma.user.findMany({
      where: { id: { in: allUserIds } },
      select: { id: true, username: true, email: true, firstName: true, lastName: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Build flagged users list
    const flaggedUsers = Array.from(userRejections.entries()).map(([userId, data]) => ({
      user: userMap.get(userId) || { id: userId, username: 'unknown' },
      rejectedAttempts: data.count,
      entries: data.entries.map(e => ({
        ...e,
        performedByUser: userMap.get(e.performedBy) || null,
      })),
    }));

    return {
      flaggedUsers: flaggedUsers.sort((a, b) => b.rejectedAttempts - a.rejectedAttempts),
      lateSubmissions: suspiciousLate.map(s => ({
        ...s,
        performedByUser: userMap.get(s.performedBy) || null,
      })),
      totalRejections: rejections.length,
      totalLateSubmissions: suspiciousLate.length,
    };
  }
}
