import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':telegramId')
  async getByTelegramId(@Param('telegramId') telegramId: string) {
    return this.usersService.findByTelegramId(telegramId);
  }

  @Post()
  async findOrCreate(@Body() body: { telegramId: string; fullName: string }) {
    return this.usersService.findOrCreateUser(body.telegramId, body.fullName);
  }
}
