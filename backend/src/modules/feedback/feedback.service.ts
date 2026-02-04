import { PrismaClient } from "@prisma/client";
import { SubmitFeedbackInput, UpdateFeedbackInput } from "./feedback.schema";

export class FeedbackService {
  constructor(private prisma: PrismaClient) {}

  async submit(data: SubmitFeedbackInput) {
    return this.prisma.feedback.create({
      data: {
        content: data.content,
        category: data.category ?? "general",
        contactEmail: data.contactEmail || null,
      },
    });
  }

  async getAll(filters?: { status?: string; category?: string }) {
    const where: Record<string, string> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;

    return this.prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats() {
    const [total, newCount, reviewed, resolved] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.count({ where: { status: "new" } }),
      this.prisma.feedback.count({ where: { status: "reviewed" } }),
      this.prisma.feedback.count({ where: { status: "resolved" } }),
    ]);
    return { total, new: newCount, reviewed, resolved };
  }

  async update(id: string, data: UpdateFeedbackInput) {
    return this.prisma.feedback.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.feedback.delete({ where: { id } });
  }
}
