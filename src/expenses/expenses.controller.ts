import { Controller, Get, Post, Body, Patch, Delete, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { IsNumber, IsInt, Min } from 'class-validator';
// bu botni javohir koma qildi
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

  @Post()
  async create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto.amount, dto.userId, dto.categoryId);
  }

  @Get()
  async getByUserId(@Query('userId', ParseIntPipe) userId: number) {
    return this.expensesService.findByUserId(userId);
  }

  @Get('stats')
  async getStats(@Query('userId', ParseIntPipe) userId: number) {
    return this.expensesService.getMonthlyStats(userId);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body('amount') amount: number) {
    return this.expensesService.update(id, amount);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.expensesService.remove(id);
  }
}
