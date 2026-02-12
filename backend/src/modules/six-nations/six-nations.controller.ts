// src/modules/six-nations/six-nations.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { SixNationsService } from "./six-nations.service";

export class SixNationsController {
  private service: SixNationsService;

  constructor(prisma: PrismaClient) {
    this.service = new SixNationsService(prisma);
  }

  // Rounds
  async getAllRounds(request: FastifyRequest, reply: FastifyReply) {
    try {
      const rounds = await this.service.getAllRounds();
      return reply.send(rounds);
    } catch (error) {
      console.error("Error fetching rounds:", error);
      return reply.status(500).send({ error: "Failed to fetch rounds" });
    }
  }

  async createRound(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as {
        roundNumber: number;
        name: string;
        startDate: string;
        endDate: string;
      };

      const round = await this.service.createRound(data);
      return reply.status(201).send(round);
    } catch (error) {
      console.error("Error creating round:", error);
      return reply.status(500).send({ error: "Failed to create round" });
    }
  }

  async updateRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body as {
        roundNumber?: number;
        name?: string;
        startDate?: string;
        endDate?: string;
      };

      const round = await this.service.updateRound(id, data);
      return reply.send(round);
    } catch (error) {
      console.error("Error updating round:", error);
      return reply.status(500).send({ error: "Failed to update round" });
    }
  }

  async deleteRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await this.service.deleteRound(id);
      return reply.status(204).send();
    } catch (error) {
      console.error("Error deleting round:", error);
      return reply.status(500).send({ error: "Failed to delete round" });
    }
  }

  async activateRound(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const round = await this.service.activateRound(id);
      return reply.send(round);
    } catch (error) {
      console.error("Error activating round:", error);
      return reply.status(500).send({ error: "Failed to activate round" });
    }
  }

  // Matches
  async getAllMatches(request: FastifyRequest, reply: FastifyReply) {
    try {
      const matches = await this.service.getAllMatches();
      return reply.send(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      return reply.status(500).send({ error: "Failed to fetch matches" });
    }
  }

  // Admin: Get ALL matches (including inactive rounds)
  async getAllMatchesAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const matches = await this.service.getAllMatchesAdmin();
      return reply.send(matches);
    } catch (error) {
      console.error("Error fetching admin matches:", error);
      return reply.status(500).send({ error: "Failed to fetch matches" });
    }
  }

  async createMatch(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as {
        roundId: string;
        matchNumber: number;
        homeTeam: string;
        awayTeam: string;
        matchDate: string;
        venue?: string;
      };

      const match = await this.service.createMatch(data);
      return reply.status(201).send(match);
    } catch (error) {
      console.error("Error creating match:", error);
      return reply.status(500).send({ error: "Failed to create match" });
    }
  }

  async updateMatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body as {
        matchNumber?: number;
        homeTeam?: string;
        awayTeam?: string;
        matchDate?: string;
        venue?: string;
      };

      const match = await this.service.updateMatch(id, data);
      return reply.send(match);
    } catch (error) {
      console.error("Error updating match:", error);
      return reply.status(500).send({ error: "Failed to update match" });
    }
  }

  async deleteMatch(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await this.service.deleteMatch(id);
      return reply.status(204).send();
    } catch (error) {
      console.error("Error deleting match:", error);
      return reply.status(500).send({ error: "Failed to delete match" });
    }
  }

  async updateMatchScore(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body as {
        homeScore: number;
        awayScore: number;
      };

      const match = await this.service.updateMatchScore(id, data.homeScore, data.awayScore);
      return reply.send(match);
    } catch (error) {
      console.error("Error updating match score:", error);
      return reply.status(500).send({ error: "Failed to update match score" });
    }
  }

  // Questions
  async getAllQuestions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const questions = await this.service.getAllQuestions();
      return reply.send(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      return reply.status(500).send({ error: "Failed to fetch questions" });
    }
  }

  // Admin: Get ALL questions (including inactive rounds)
  async getAllQuestionsAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const questions = await this.service.getAllQuestionsAdmin();
      return reply.send(questions);
    } catch (error) {
      console.error("Error fetching admin questions:", error);
      return reply.status(500).send({ error: "Failed to fetch questions" });
    }
  }

  async createQuestion(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as {
        matchId: string;
        questionNumber: number;
        questionText: string;
        questionType: string;
        options?: string[];
        points: number;
      };

      const question = await this.service.createQuestion(data);
      return reply.status(201).send(question);
    } catch (error) {
      console.error("Error creating question:", error);

      // Handle validation errors with 400 Bad Request
      if (error instanceof Error && (
        error.message.includes('Duplicate answer options') ||
        error.message.includes('Empty answer options')
      )) {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Failed to create question" });
    }
  }

  async updateQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body as {
        questionNumber?: number;
        questionText?: string;
        questionType?: string;
        options?: string[];
        points?: number;
        correctAnswer?: string | null;
      };

      const question = await this.service.updateQuestion(id, data);
      return reply.send(question);
    } catch (error) {
      console.error("Error updating question:", error);

      // Handle validation errors with 400 Bad Request
      if (error instanceof Error && (
        error.message.includes('Duplicate answer options') ||
        error.message.includes('Empty answer options') ||
        error.message.includes('Question not found')
      )) {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: "Failed to update question" });
    }
  }

  async deleteQuestion(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      await this.service.deleteQuestion(id);
      return reply.status(204).send();
    } catch (error) {
      console.error("Error deleting question:", error);
      return reply.status(500).send({ error: "Failed to delete question" });
    }
  }

  async setCorrectAnswer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body as {
        correctAnswer: string;
      };

      const question = await this.service.setCorrectAnswer(id, data.correctAnswer);
      return reply.send(question);
    } catch (error) {
      console.error("Error setting correct answer:", error);
      return reply.status(500).send({ error: "Failed to set correct answer" });
    }
  }

  async clearCorrectAnswer(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const question = await this.service.clearCorrectAnswer(id);
      return reply.send(question);
    } catch (error) {
      console.error("Error clearing correct answer:", error);
      return reply.status(500).send({ error: "Failed to clear correct answer" });
    }
  }

  // Admin user management
  async getAdminUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await this.service.getAdminUsers();
      return reply.send(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      return reply.status(500).send({ error: "Failed to fetch admin users" });
    }
  }

  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await this.service.getAllUsers();
      return reply.send(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
      return reply.status(500).send({ error: "Failed to fetch users" });
    }
  }

  async addAdminByEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as {
        email: string;
      };

      const user = await this.service.addAdminByEmail(data.email);
      return reply.send(user);
    } catch (error) {
      console.error("Error adding admin by email:", error);

      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return reply.status(404).send({ error: error.message });
        }
        if (error.message.includes('already an admin')) {
          return reply.status(400).send({ error: error.message });
        }
      }

      return reply.status(500).send({ error: "Failed to add admin" });
    }
  }

  async toggleUserAdmin(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const data = request.body as {
        isAdmin: boolean;
      };

      const user = await this.service.toggleUserAdmin(id, data.isAdmin);
      return reply.send(user);
    } catch (error) {
      console.error("Error toggling user admin status:", error);
      return reply.status(500).send({ error: "Failed to toggle user admin status" });
    }
  }

  // User answers
  async submitAnswers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.currentUser as any)?.id;
      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const data = request.body as {
        answers: { questionId: string; answer: string }[];
      };

      const answers = await this.service.submitAnswers(userId, data.answers);
      return reply.status(201).send(answers);
    } catch (error) {
      console.error("Error submitting answers:", error);
      return reply.status(500).send({ error: "Failed to submit answers" });
    }
  }

  async getUserAnswers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request.currentUser as any)?.id;
      if (!userId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const { roundId } = request.query as { roundId?: string };

      const answers = await this.service.getUserAnswers(userId, roundId);
      return reply.send(answers);
    } catch (error) {
      console.error("Error fetching user answers:", error);
      return reply.status(500).send({ error: "Failed to fetch user answers" });
    }
  }

  // Get specific user's answers (for viewing other players' picks)
  async getSpecificUserAnswers(request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) {
    try {
      const requestingUserId = (request as any).currentUser?.id;
      if (!requestingUserId) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const targetUserId = request.params.userId;
      const { roundId } = request.query as { roundId?: string };

      // Use visibility filtering to prevent cheating
      const answers = await this.service.getUserAnswersWithVisibility(
        targetUserId,
        requestingUserId,
        roundId
      );
      return reply.send(answers);
    } catch (error) {
      console.error("Error fetching specific user answers:", error);
      return reply.status(500).send({ error: "Failed to fetch user answers" });
    }
  }

  // Leaderboard
  async getLeaderboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { roundId, scope } = request.query as { roundId?: string; scope?: string };

      const leaderboard = await this.service.getLeaderboard(roundId, scope);
      return reply.send(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return reply.status(500).send({ error: "Failed to fetch leaderboard" });
    }
  }
}
