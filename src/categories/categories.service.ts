import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany();
  }

  async create(name: string) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('Category name cannot be empty');
    }
    return this.prisma.category.create({
      data: { name: name.trim() },
    });
  }

  async findById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }
}
