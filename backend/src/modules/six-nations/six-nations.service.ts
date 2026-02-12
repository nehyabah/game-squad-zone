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

  async updateMatchScore(id: string, homeScore: number, awayScore: number) {
    return this.prisma.sixNationsMatch.update({
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

  async setCorrectAnswer(id: string, correctAnswer: string) {
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

    return question;
  }

  async clearCorrectAnswer(id: string) {
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
    // Use transaction to ensure all answers are saved together
    const savedAnswers = await this.prisma.$transaction(
      answers.map(({ questionId, answer }) =>
        this.prisma.sixNationsAnswer.upsert({
          where: {
            questionId_userId: {
              questionId,
              userId,
            },
          },
          update: {
            answer,
            // If correct answer is already set, calculate isCorrect
            isCorrect: undefined, // Will be updated via separate query
          },
          create: {
            questionId,
            userId,
            answer,
            isCorrect: null,
          },
          include: {
            question: true,
          },
        })
      )
    );

    // For each answer, if the question has a correct answer set, calculate isCorrect
    for (const savedAnswer of savedAnswers) {
      if (savedAnswer.question.correctAnswer) {
        await this.prisma.sixNationsAnswer.update({
          where: { id: savedAnswer.id },
          data: {
            isCorrect: savedAnswer.answer === savedAnswer.question.correctAnswer,
          },
        });
      }
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
    // Return all users with their admin status
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
}
