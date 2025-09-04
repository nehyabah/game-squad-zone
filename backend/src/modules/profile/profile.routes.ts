// src/modules/profile/profile.routes.ts

import { FastifyInstance } from "fastify";

export default async function profileRoutes(app: FastifyInstance) {
  // GET /profile - Get current user profile
  app.get("/profile", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const userId = req.currentUser!.id;

      const user = await app.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          displayName: true,
          phoneNumber: true,
          avatarUrl: true,
          walletBalance: true,
          walletCurrency: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      return user;
    } catch (error) {
      console.error("Profile fetch error:", error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });

  // PUT /profile - Update user profile
  app.put("/profile", { preHandler: [app.auth] }, async (req, reply) => {
    try {
      const userId = req.currentUser!.id;

      const {
        displayName,
        firstName,
        lastName,
        phoneNumber,
        avatarUrl,
        username,
      } = req.body as {
        displayName?: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
        username?: string;
      };

      // Validate phone number format if provided
      // Fix for phoneNumber validation (around line 59)
      if (phoneNumber && phoneNumber.trim()) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanedPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
        if (!phoneRegex.test(cleanedPhone)) {
          return reply.status(400).send({
            error: "Invalid phone number format",
          });
        }
      }

      // Validate display name length if provided
      if (displayName && displayName.trim() && displayName.trim().length > 50) {
        return reply.status(400).send({
          error: "Display name must be 50 characters or less",
        });
      }

      // Check if username is already taken (if provided and not empty)
      if (
        username !== undefined &&
        username !== null &&
        username.trim() !== ""
      ) {
        const trimmedUsername = username.trim();

        // Validate username format first
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(trimmedUsername)) {
          return reply.status(400).send({
            error:
              "Username must be 3-20 characters and contain only letters, numbers, and underscores",
          });
        }

        // Then check if it's already taken
        const existingUser = await app.prisma.user.findFirst({
          where: {
            username: trimmedUsername,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return reply.status(400).send({ error: "Username already taken" });
        }
      }

      // Prepare update data
      const updateData: {
        displayName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        phoneNumber?: string | null;
        avatarUrl?: string | null;
        username?: string;
      } = {};

      if (displayName !== undefined) {
        updateData.displayName = displayName.trim() || null;
      }
      if (firstName !== undefined) {
        updateData.firstName = firstName.trim() || null;
      }
      if (lastName !== undefined) {
        updateData.lastName = lastName.trim() || null;
      }
      if (phoneNumber !== undefined) {
        updateData.phoneNumber = phoneNumber.trim() || null;
      }
      if (avatarUrl !== undefined) {
        updateData.avatarUrl = avatarUrl.trim() || null;
      }
      if (
        username !== undefined &&
        username !== null &&
        username.trim() !== ""
      ) {
        updateData.username = username.trim();
      }

      const updatedUser = await app.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          displayName: true,
          phoneNumber: true,
          avatarUrl: true,
          walletBalance: true,
          walletCurrency: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      return {
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      };
    } catch (error) {
      console.error("Profile update error:", error);
      return reply.status(500).send({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  });
}
