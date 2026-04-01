import { Controller, Get, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { IsNumber, IsInt, Min } from 'class-validator';

class CreateExpenseDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsInt()
  userId: number;

  @IsInt()
  categoryId: number;
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async getByUserId(@Query('userId', ParseIntPipe) userId: number) {
    return this.expensesService.findByUserId(userId);
  }

  @Get('stats')
  async getStats(@Query('userId', ParseIntPipe) userId: number) {
    return this.expensesService.getMonthlyStats(userId);
  }

  @Post()
  async create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto.amount, dto.userId, dto.categoryId);
  }
}
