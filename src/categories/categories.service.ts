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

  async update(id: number, name: string) {
    return this.prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });
  }

  async remove(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
// bu botni javohir koma qildi