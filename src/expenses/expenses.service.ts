import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(amount: number, userId: number, categoryId: number) {
    return this.prisma.expense.create({
      data: { amount, userId, categoryId },
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.expense.findMany({
      where: { userId },
      include: { category: true },
    });
  }

  async getMonthlyStats(userId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const stats = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Fetch corresponding categories to map names
    const categories = await this.prisma.category.findMany({
      where: { id: { in: stats.map((s) => s.categoryId) } },
    });

    return stats.map((stat) => {
      const cat = categories.find((c) => c.id === stat.categoryId);
      return {
        categoryId: stat.categoryId,
        categoryName: cat?.name || 'Unknown',
        totalAmount: stat._sum.amount,
      };
    });
  }
}
