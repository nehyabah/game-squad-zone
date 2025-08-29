// src/modules/squads/squads.service.ts
import type { PrismaClient } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import crypto from "crypto";
import Stripe from "stripe";

interface SquadCreateData {
  name: string;
  description?: string;
  imageUrl?: string;
  potEnabled?: boolean;
  potAmount?: number;
  potDeadline?: Date;
}

interface SquadUpdateData {
  name?: string;
  description?: string;
  imageUrl?: string;
  potEnabled?: boolean;
  potAmount?: number;
  potDeadline?: Date;
  stripePriceId?: string;
  stripeProductId?: string;
}

export class SquadsService {
  private stripe: Stripe | null = null;

  constructor(private app: FastifyInstance, private prisma: PrismaClient) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2023-10-16",
      });
    }
  }

  // Generate unique join code
  private generateJoinCode(): string {
    return crypto.randomBytes(4).toString("hex").toUpperCase();
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
      joinCode,
      ownerId: userId,
      potEnabled: data.potEnabled || false,
      potAmount: data.potAmount,
      potDeadline: data.potDeadline,
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
          currency: "usd",
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
    // Check if user is owner or admin
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!squad) {
      throw new Error("Squad not found");
    }

    const member = squad.members[0];
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Only squad owner or admin can update settings");
    }

    // Copy data to allow modifications
    const updateData: SquadUpdateData = { ...data };

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
            currency: "usd",
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
  async getUserSquads(userId: string) {
    const squads = await this.prisma.squad.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
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

    return squads.map((squad) => ({
      ...squad,
      totalPot: squad.payments.reduce((sum, p) => sum + p.amount, 0) / 100,
    }));
  }

  // Get squad details
  async getSquad(squadId: string, userId: string) {
    const squad = await this.prisma.squad.findFirst({
      where: {
        id: squadId,
        members: {
          some: {
            userId,
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
      throw new Error("Squad not found or access denied");
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
      throw new Error("Already a member of this squad");
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
                avatarUrl: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
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

    // Can't leave if you're the owner
    if (squad.ownerId === userId) {
      throw new Error(
        "Owner cannot leave squad. Transfer ownership or delete squad."
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
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
    });

    if (!squad || squad.ownerId !== requesterId) {
      throw new Error("Only squad owner can update roles");
    }

    if (targetUserId === requesterId) {
      throw new Error("Cannot change your own role");
    }

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

  // Delete squad (owner only)
  async deleteSquad(userId: string, squadId: string) {
    const squad = await this.prisma.squad.findUnique({
      where: { id: squadId },
    });

    if (!squad || squad.ownerId !== userId) {
      throw new Error("Only squad owner can delete squad");
    }

    await this.prisma.squad.delete({
      where: { id: squadId },
    });

    return { message: "Squad deleted successfully" };
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
}
