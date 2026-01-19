// src/modules/squads/squads.service.ts
import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import type { CreateSquadInput, JoinSquadInput } from "./squads.dto";
import { randomBytes } from "crypto";
import Stripe from "stripe";
import { PushNotificationService } from "../../services/push-notification.service";

interface SquadCreateData {
  name: string;
  description?: string;
  imageUrl?: string;
  maxMembers: number;
  potEnabled?: boolean;
  potAmount?: number;
  potDeadline?: string;
  sport?: 'nfl' | 'six-nations';
}

interface SquadUpdateData {
  name?: string;
  description?: string;
  imageUrl?: string;
  maxMembers?: number;
  potEnabled?: boolean;
  potAmount?: number;
  potDeadline?: string;
  stripePriceId?: string;
  stripeProductId?: string;
}

// Error classes
export class InvalidJoinCodeError extends Error {
  constructor(message = "Invalid join code") {
    super(message);
    this.name = "InvalidJoinCodeError";
  }
}

export class AlreadyMemberError extends Error {
  constructor(message = "User already belongs to this squad") {
    super(message);
    this.name = "AlreadyMemberError";
  }
}

export class SquadNotFoundError extends Error {
  constructor(message = "Squad not found") {
    super(message);
    this.name = "SquadNotFoundError";
  }
}

export class SquadService {
  private stripe: Stripe | null = null;
  private notificationService: PushNotificationService;

  constructor(private app: FastifyInstance, private prisma: PrismaClient) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
    }
    this.notificationService = new PushNotificationService(prisma);
  }

  // Generate unique join code
  private generateJoinCode(): string {
    return randomBytes(4).toString("hex").toUpperCase();
  }

  // Validate squad ownership
  private async validateSquadOwnership(
    squadId: string,
    userId: string
  ): Promise<void> {
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      select: { ownerId: true },
    });

    if (!squad) {
      throw new SquadNotFoundError();
    }

    if (squad.ownerId !== userId) {
      throw new Error("Only squad owner can perform this action");
    }
  }

  // Validate squad membership
  private async validateSquadMembership(
    squadId: string,
    userId: string
  ): Promise<void> {
    const member = await this.prisma.squadMember.findUnique({
      where: { squadId_userId: { squadId, userId } },
    });

    if (!member) {
      throw new Error("User is not a member of this squad");
    }
  }

  // Create a new squad
  async createSquad(userId: string, data: SquadCreateData) {
    // Generate unique join code
    let joinCode = this.generateJoinCode();
    let attempts = 0;

    while (await this.prisma.squad.findUnique({ where: { joinCode } })) {
      joinCode = this.generateJoinCode();
      attempts++;
      if (attempts > 10) {
        throw new Error("Failed to generate unique join code");
      }
    }

    // Prepare create data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      maxMembers: data.maxMembers,
      joinCode,
      ownerId: userId,
      potEnabled: data.potEnabled || false,
      potAmount: data.potAmount,
      potDeadline: data.potDeadline ? new Date(data.potDeadline) : undefined,
      sport: data.sport || 'nfl',
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    };

    // Create Stripe product if pot is enabled
    if (data.potEnabled && data.potAmount && this.stripe) {
      try {
        // Create product in Stripe
        const product = await this.stripe.products.create({
          name: `${data.name} - Squad Pot`,
          description: data.description || `Entry fee for ${data.name} squad`,
          metadata: {
            squadJoinCode: joinCode,
            type: "squad_pot",
          },
        });

        createData.stripeProductId = product.id;

        // Create price
        const price = await this.stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(data.potAmount * 100), // Convert to cents
          currency: "eur",
          metadata: {
            squadJoinCode: joinCode,
          },
        });

        createData.stripePriceId = price.id;
      } catch (error) {
        console.error("Failed to create Stripe product:", error);
        // Continue without Stripe integration
      }
    }

    // Create squad with owner as first member
    const squad = await this.prisma.squad.create({
      data: createData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        payments: true,
        _count: {
          select: {
            members: true,
            payments: true,
          },
        },
      },
    });

    return squad;
  }

  // Update squad settings
  async updateSquadSettings(
    userId: string,
    squadId: string,
    data: SquadUpdateData
  ) {
    // Validate squad ownership (only owner can update settings)
    await this.validateSquadOwnership(squadId, userId);

    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
    });

    if (!squad) {
      throw new SquadNotFoundError();
    }

    // Copy data to allow modifications and convert date string
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const updateData: any = {
      ...data,
      potDeadline: data.potDeadline ? new Date(data.potDeadline) : undefined,
    };

    // Update Stripe if pot settings changed
    if (data.potEnabled && data.potAmount && this.stripe) {
      try {
        if (squad.stripeProductId) {
          // Update existing product
          await this.stripe.products.update(squad.stripeProductId, {
            name: `${data.name || squad.name} - Squad Pot`,
            description: data.description || squad.description || undefined,
          });
        } else {
          // Create new product
          const product = await this.stripe.products.create({
            name: `${data.name || squad.name} - Squad Pot`,
            description:
              data.description ||
              `Entry fee for ${data.name || squad.name} squad`,
            metadata: {
              squadId,
              type: "squad_pot",
            },
          });

          const price = await this.stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(data.potAmount * 100),
            currency: "eur",
            metadata: { squadId },
          });

          updateData.stripePriceId = price.id;
          updateData.stripeProductId = product.id;
        }
      } catch (error) {
        console.error("Failed to update Stripe product:", error);
      }
    }

    const updatedSquad = await this.prisma.squad.update({
      where: { id: squadId },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        payments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            payments: true,
          },
        },
      },
    });

    return updatedSquad;
  }

  // Get user's squads
  async getUserSquads(userId: string, sport?: string) {
    const squads = await this.prisma.squad.findMany({
      where: {
        members: {
          some: { userId },
        },
        ...(sport && { sport }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        payments: {
          where: {
            status: "completed",
          },
        },
        _count: {
          select: {
            members: true,
            payments: true,
          },
        },
      },
    });

    // For each squad, calculate unread message count for the current user
    const squadsWithUnread = await Promise.all(
      squads.map(async (squad) => {
        // Get user's membership to check lastReadAt
        const userMembership = await this.prisma.squadMember.findUnique({
          where: {
            squadId_userId: {
              squadId: squad.id,
              userId,
            },
          },
          select: { lastReadAt: true },
        });

        // Count unread messages (messages created after lastReadAt, or all if never read)
        const unreadCount = await this.prisma.squadMessage.count({
          where: {
            squadId: squad.id,
            createdAt: {
              gt: userMembership?.lastReadAt || new Date(0), // If never read, compare to epoch
            },
          },
        });

        return {
          ...squad,
          totalPot: squad.payments.reduce((sum, p) => sum + p.amount, 0) / 100,
          unreadCount,
        };
      })
    );

    return squadsWithUnread;
  }

  // Get squad details
  async getSquad(squadId: string, userId: string) {
    // Validate squad membership
    await this.validateSquadMembership(squadId, userId);

    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        payments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            payments: true,
          },
        },
      },
    });

    if (!squad) {
      throw new SquadNotFoundError();
    }

    return squad;
  }

  // Join squad with code
  async joinSquad(userId: string, joinCode: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { joinCode },
      include: {
        members: true,
      },
    });

    if (!squad) {
      throw new Error("Invalid join code");
    }

    // Check if already a member
    const existingMember = squad.members.find((m) => m.userId === userId);
    if (existingMember) {
      throw new Error(
        `🎯 Hold up! You're already part of the "${squad.name}" squad! No need to join twice - you're already in the game!`
      );
    }

    // Check if squad is at maximum capacity
    if (squad.members.length >= squad.maxMembers) {
      throw new Error(
        `🚫 Squad is full! (${squad.maxMembers}/${squad.maxMembers} members)`
      );
    }

    // Add user as member
    const updatedSquad = await this.prisma.squad.update({
      where: { id: squad.id },
      data: {
        members: {
          create: {
            userId,
            role: "member",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedSquad;
  }

  // Leave squad
  async leaveSquad(userId: string, squadId: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: true,
      },
    });

    if (!squad) {
      throw new Error("Squad not found");
    }

    // Can't leave if you're the owner and there are other members
    if (squad.ownerId === userId) {
      const memberCount = squad.members.length;
      if (memberCount > 1) {
        const otherMembers = memberCount - 1;
        throw new Error(
          `👑 As squad owner, you can't abandon your ${otherMembers} member${
            otherMembers === 1 ? "" : "s"
          }! ` + `Transfer ownership or wait for everyone to leave.`
        );
      }
      // If owner is the only member, they should delete the squad instead
      throw new Error(
        "🗑️ You're the last one here. Delete the squad instead of leaving!"
      );
    }

    // Remove member
    await this.prisma.squadMember.deleteMany({
      where: {
        squadId,
        userId,
      },
    });

    return { message: "Successfully left squad" };
  }

  // Update member role (owner only)
  async updateMemberRole(
    requesterId: string,
    squadId: string,
    targetUserId: string,
    newRole: "admin" | "member"
  ) {
    // Validate squad ownership
    await this.validateSquadOwnership(squadId, requesterId);

    if (targetUserId === requesterId) {
      throw new Error("Cannot change your own role");
    }

    // Validate target user is a member
    await this.validateSquadMembership(squadId, targetUserId);

    await this.prisma.squadMember.update({
      where: {
        squadId_userId: {
          squadId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
    });

    return { message: "Role updated successfully" };
  }

  // Remove member from squad (owner only)
  async removeMember(
    requesterId: string,
    squadId: string,
    targetUserId: string
  ) {
    // Validate squad ownership
    await this.validateSquadOwnership(squadId, requesterId);

    if (targetUserId === requesterId) {
      throw new Error(
        "Cannot remove yourself from the squad. Use leave squad instead."
      );
    }

    // Validate target user is a member
    await this.validateSquadMembership(squadId, targetUserId);

    // Get user info for success message
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true, displayName: true },
    });

    // Remove the member
    await this.prisma.squadMember.delete({
      where: {
        squadId_userId: {
          squadId,
          userId: targetUserId,
        },
      },
    });

    const displayName = user?.displayName || user?.username || "Member";
    return { message: `${displayName} has been removed from the squad` };
  }

  // Delete squad (owner only)
  async deleteSquad(userId: string, squadId: string) {
    // Validate squad ownership
    await this.validateSquadOwnership(squadId, userId);

    // Check if there are other members in the squad
    const memberCount = await this.prisma.squadMember.count({
      where: { squadId },
    });

    if (memberCount > 1) {
      const otherMembers = memberCount - 1;
      throw new Error(
        `⚠️ Squad has ${otherMembers} active member${
          otherMembers === 1 ? "" : "s"
        }! ` + `All members must leave before you can delete this squad.`
      );
    }

    // Check if there are any completed payments (pot contributions)
    const completedPayments = await this.prisma.squadPayment.count({
      where: {
        squadId,
        status: "completed",
      },
    });

    if (completedPayments > 0) {
      throw new Error(
        `💰 Squad has active pot contributions! ` +
          `Please resolve all financial matters before deleting.`
      );
    }

    await this.prisma.squad.delete({
      where: { id: squadId },
    });

    return { message: "Squad deleted successfully" };
  }

  // Methods expected by controller
  async create(data: CreateSquadInput, userId: string) {
    // Ensure name is present (validated by Zod)
    const squadData: SquadCreateData = {
      name: data.name!,
      description: data.description,
      imageUrl: data.imageUrl,
      maxMembers: data.maxMembers!,
      potEnabled: data.potEnabled,
      potAmount: data.potAmount,
      potDeadline: data.potDeadline,
      sport: data.sport || 'nfl', // Include sport with default
    };
    return this.createSquad(userId, squadData);
  }

  async join(data: JoinSquadInput, userId: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { joinCode: data.joinCode },
      include: { members: true },
    });

    if (!squad) {
      throw new InvalidJoinCodeError();
    }

    // Check if already a member
    const existingMember = squad.members.find((m) => m.userId === userId);
    if (existingMember) {
      throw new AlreadyMemberError();
    }

    return this.joinSquad(userId, data.joinCode);
  }

  async get(squadId: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        payments: true,
      },
    });

    if (!squad) {
      throw new SquadNotFoundError();
    }

    return squad;
  }

  async listMembers(squadId: string) {
    const members = await this.prisma.squadMember.findMany({
      where: { squadId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return members.map((member) => ({
      ...member.user,
      role: member.role,
      joinedAt: member.id, // Using id as placeholder for joinedAt
    }));
  }

  // Create checkout session for squad pot payment
  async createPotPaymentSession(userId: string, squadId: string) {
    if (!this.stripe) {
      throw new Error("Stripe not configured");
    }

    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          where: { userId },
          include: {
            user: true,
          },
        },
        payments: {
          where: { userId },
        },
      },
    });

    if (!squad) {
      throw new Error("Squad not found");
    }

    if (!squad.members.length) {
      throw new Error("You must be a member to pay the pot");
    }

    if (squad.payments.length && squad.payments[0].status === "completed") {
      throw new Error("You have already paid the pot");
    }

    if (!squad.potEnabled || !squad.stripePriceId) {
      throw new Error("Pot is not enabled for this squad");
    }

    if (squad.potDeadline && squad.potDeadline < new Date()) {
      throw new Error("Pot payment deadline has passed");
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: squad.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/squads/${squadId}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/squads/${squadId}?payment=cancelled`,
      metadata: {
        squadId,
        userId,
        type: "squad_pot",
      },
      customer_email: squad.members[0].user?.email,
    });

    // Create or update payment record
    await this.prisma.squadPayment.upsert({
      where: {
        squadId_userId: { squadId, userId },
      },
      create: {
        squadId,
        userId,
        amount: squad.potAmount!,
        currency: squad.potCurrency,
        stripeSessionId: session.id,
        status: "pending",
      },
      update: {
        stripeSessionId: session.id,
        status: "pending",
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  // Get pot status for a squad
  async getPotStatus(squadId: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        payments: {
          where: { status: "completed" },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!squad) {
      throw new Error("Squad not found");
    }

    const totalPot = squad.payments.reduce((sum, p) => sum + p.amount, 0) / 100;
    const paidMembers = squad.payments.length;
    const totalMembers = squad._count.members;
    const percentPaid =
      totalMembers > 0 ? (paidMembers / totalMembers) * 100 : 0;

    return {
      potEnabled: squad.potEnabled,
      potAmount: squad.potAmount,
      potDeadline: squad.potDeadline,
      totalCollected: totalPot,
      paidMembers,
      totalMembers,
      percentPaid,
      payments: squad.payments,
    };
  }

  // Create join request
  async createJoinRequest(userId: string, joinCode: string, message?: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { joinCode },
      include: {
        members: true,
      },
    });

    if (!squad) {
      throw new Error("Invalid join code");
    }

    // Check if already a member
    const existingMember = squad.members.find((m) => m.userId === userId);
    if (existingMember) {
      throw new Error(
        `You're already part of the "${squad.name}" squad!`
      );
    }

    // Check if squad is at maximum capacity
    if (squad.members.length >= squad.maxMembers) {
      throw new Error(
        `Squad is full! (${squad.maxMembers}/${squad.maxMembers} members)`
      );
    }

    // Check for existing pending request
    const existingRequest = await this.prisma.squadJoinRequest.findUnique({
      where: {
        squadId_userId: {
          squadId: squad.id,
          userId,
        },
      },
    });

    if (existingRequest && existingRequest.status === "pending") {
      throw new Error("You already have a pending join request for this squad");
    }

    // Create or update join request
    const joinRequest = await this.prisma.squadJoinRequest.upsert({
      where: {
        squadId_userId: {
          squadId: squad.id,
          userId,
        },
      },
      create: {
        squadId: squad.id,
        userId,
        message,
        status: "pending",
      },
      update: {
        message,
        status: "pending",
        requestedAt: new Date(),
        respondedAt: null,
        respondedBy: null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        squad: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Send notification to squad admins/owners
    const requesterName = joinRequest.user.displayName || joinRequest.user.username;
    await this.notificationService.sendJoinRequestNotification(
      squad.id,
      userId,
      requesterName,
      squad.name
    );

    return joinRequest;
  }

  // Get pending join requests for a squad (admin/owner only)
  async getPendingJoinRequests(userId: string, squadId: string) {
    // Check if user is admin or owner
    const member = await this.prisma.squadMember.findUnique({
      where: {
        squadId_userId: {
          squadId,
          userId,
        },
      },
    });

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Only squad owners and admins can view join requests");
    }

    const requests = await this.prisma.squadJoinRequest.findMany({
      where: {
        squadId,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: {
        requestedAt: "desc",
      },
    });

    return requests;
  }

  // Approve join request (admin/owner only)
  async approveJoinRequest(
    responderId: string,
    squadId: string,
    requestId: string
  ) {
    // Check if user is admin or owner
    const member = await this.prisma.squadMember.findUnique({
      where: {
        squadId_userId: {
          squadId,
          userId: responderId,
        },
      },
    });

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Only squad owners and admins can approve join requests");
    }

    const request = await this.prisma.squadJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        squad: {
          include: {
            members: true,
          },
        },
        user: true,
      },
    });

    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.squadId !== squadId) {
      throw new Error("Join request does not belong to this squad");
    }

    if (request.status !== "pending") {
      throw new Error("Join request has already been processed");
    }

    // Check if user account is active
    if (request.user.status !== "active") {
      throw new Error("Cannot approve request - user account is not active");
    }

    // Check if squad is at maximum capacity
    if (request.squad.members.length >= request.squad.maxMembers) {
      throw new Error(
        `Squad is full! (${request.squad.maxMembers}/${request.squad.maxMembers} members)`
      );
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Update join request
      await tx.squadJoinRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          respondedAt: new Date(),
          respondedBy: responderId,
        },
      });

      // Add user as member
      await tx.squadMember.create({
        data: {
          squadId,
          userId: request.userId,
          role: "member",
        },
      });

      // Get updated squad with new member
      return tx.squad.findUnique({
        where: { id: squadId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    // Send notification to the user who requested to join
    await this.notificationService.sendJoinApprovedNotification(
      request.userId,
      request.squad.name,
      squadId
    );

    return result;
  }

  // Reject join request (admin/owner only)
  async rejectJoinRequest(
    responderId: string,
    squadId: string,
    requestId: string
  ) {
    // Check if user is admin or owner
    const member = await this.prisma.squadMember.findUnique({
      where: {
        squadId_userId: {
          squadId,
          userId: responderId,
        },
      },
    });

    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Only squad owners and admins can reject join requests");
    }

    const request = await this.prisma.squadJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        squad: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error("Join request not found");
    }

    if (request.squadId !== squadId) {
      throw new Error("Join request does not belong to this squad");
    }

    if (request.status !== "pending") {
      throw new Error("Join request has already been processed");
    }

    // Update join request
    await this.prisma.squadJoinRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        respondedAt: new Date(),
        respondedBy: responderId,
      },
    });

    // Send notification to the user who requested to join
    await this.notificationService.sendJoinRejectedNotification(
      request.userId,
      request.squad.name
    );

    return { message: "Join request rejected" };
  }

  // Get user's join request status for a squad
  async getUserJoinRequestStatus(userId: string, squadId: string) {
    const request = await this.prisma.squadJoinRequest.findUnique({
      where: {
        squadId_userId: {
          squadId,
          userId,
        },
      },
      include: {
        squad: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return request;
  }

  // Get all of user's join requests across all squads
  async getUserJoinRequests(userId: string, sport?: string) {
    const requests = await this.prisma.squadJoinRequest.findMany({
      where: {
        userId,
        status: 'pending', // Only show pending requests
        ...(sport && { squad: { sport } }),
      },
      include: {
        squad: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return requests;
  }
}
