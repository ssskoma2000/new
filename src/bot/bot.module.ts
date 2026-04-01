import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { UsersModule } from '../users/users.module';
import { CategoriesModule } from '../categories/categories.module';
import { ExpensesModule } from '../expenses/expenses.module';

@Module({
  imports: [UsersModule, CategoriesModule, ExpensesModule],
  providers: [BotService],
})
export class BotModule {}
