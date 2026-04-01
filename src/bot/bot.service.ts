import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context, session, InlineKeyboard } from 'grammy';
import { conversations, createConversation, type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { CategoriesService } from '../categories/categories.service';
import { ExpensesService } from '../expenses/expenses.service';

type MyContext = Context & any;
type MyConversation = Conversation<MyContext>;

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Bot<MyContext>;
  private readonly logger = new Logger(BotService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private categoriesService: CategoriesService,
    private expensesService: ExpensesService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || this.configService.get<string>('BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN topilmadi! .env fayliga "TELEGRAM_BOT_TOKEN=SizningTokeningiz" ni qo\'shing va faylni SAVe qiling (saqlang).');
      return;
    }
    this.bot = new Bot<MyContext>(token);
  }

  async onModuleInit() {
    if (!this.bot) return;

    // Grammy plugins usage requirement
    this.bot.use(session({ initial: () => ({}) }));
    this.bot.use(conversations());

    // Register conversation flows
    this.bot.use(createConversation(this.addExpenseFlow.bind(this), 'addExpenseFlow'));
    this.bot.use(createConversation(this.addCategoryFlow.bind(this), 'addCategoryFlow'));

    // Command Handlers
    this.bot.command('start', async (ctx) => {
      const telegramId = String(ctx.from?.id);
      const fullName = ctx.from?.first_name || 'User';
      
      try {
        await this.usersService.findOrCreateUser(telegramId, fullName);
        await ctx.reply("Xush kelibsiz! Harajatlarni kiritish uchun /add_expense ni,\nKategoriya qo'shish uchun /add_category ni,\nStatistikani ko'rish uchun /stats ni yuboring.");
      } catch (error) {
         this.logger.error(error);
         await ctx.reply('Tizim xatoligi yuz berdi.');
      }
    });

    this.bot.command('add_expense', async (ctx) => {
      try {
        await ctx.conversation.enter('addExpenseFlow');
      } catch (e) {
        this.logger.error(e);
      }
    });

    this.bot.command('add_category', async (ctx) => {
      try {
        await ctx.conversation.enter('addCategoryFlow');
      } catch (e) {
        this.logger.error(e);
      }
    });

    this.bot.command('stats', async (ctx) => {
      try {
        const telegramId = String(ctx.from?.id);
        const user = await this.usersService.findOrCreateUser(telegramId, ctx.from?.first_name || 'User');
        
        const stats = await this.expensesService.getMonthlyStats(user.id);

        if (stats.length === 0) {
          await ctx.reply('Joriy oy uchun xarajatlar mavjud emas.');
          return;
        }

        let message = '📊 *Oylik xarajatlar statistikasi*\n\n';
        let total = 0;
        stats.forEach(stat => {
          message += `➖ ${stat.categoryName}: ${stat.totalAmount || 0} so'm\n`;
          total += (stat.totalAmount || 0);
        });
        message += `\n*Jami*: ${total} so'm`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
      } catch (e) {
         this.logger.error(e);
         await ctx.reply('Xatolik yuz berdi.');
      }
    });

    // Start bot
    this.bot.start({
      onStart: (botInfo) => {
        this.logger.log(`Bot initialized as @${botInfo.username}`);
      }
    });
  }

  private async addExpenseFlow(conversation: MyConversation, ctx: MyContext) {
    const telegramId = String(ctx.from?.id);
    const user = await conversation.external(() => 
      this.usersService.findOrCreateUser(telegramId, ctx.from?.first_name || 'User')
    );

    await ctx.reply('Summani kiriting:');
    
    // Step 1: Wait for amount
    const amountCtx = await conversation.wait();
    if (!amountCtx.message?.text) {
      await ctx.reply("Faqat son kiritish kerak. Jarayon to'xtatildi.");
      return;
    }

    const amount = parseFloat(amountCtx.message.text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply("Noto'g'ri summa kiritildi. Jarayon to'xtatildi.");
      return;
    }

    // Step 2: Display categories
    const categories = await conversation.external(() => this.categoriesService.findAll());
    if (categories.length === 0) {
      await ctx.reply("Hali hech qanday kategoriya yo'q. Avval /add_category orqali kategoriya qo'shing.");
      return;
    }

    const keyboard = new InlineKeyboard();
    categories.forEach((cat, index) => {
      keyboard.text(cat.name, `cat_${cat.id}`);
      if ((index + 1) % 2 === 0) keyboard.row();
    });

    await ctx.reply('Kategoriya tanlang:', { reply_markup: keyboard });

    // Step 3: Wait for inline keyboard callback
    const callbackCtx = await conversation.waitForCallbackQuery(/cat_\d+/);
    await callbackCtx.answerCallbackQuery();

    const matchedParts = callbackCtx.match[0].split('_');
    const categoryId = parseInt(matchedParts[1], 10);

    // Validate category relation
    const categoryExists = categories.some((c) => c.id === categoryId);
    if (!categoryExists) {
        await ctx.reply('Xato: Kategoriya tizimda mavjud emas.');
        return;
    }

    // Step 4: Write to DB
    await conversation.external(() => 
      this.expensesService.create(amount, user.id, categoryId)
    );

    await callbackCtx.editMessageText(`Summa: ${amount} so'm\nXarajatingiz saqlandi ✅`);
  }

  private async addCategoryFlow(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply('Kategoriya nomini kiriting:');
    
    const nameCtx = await conversation.wait();
    if (!nameCtx.message?.text) {
      await ctx.reply("Noto'g'ri nom. Jarayon to'xtatildi.");
      return;
    }

    const name = nameCtx.message.text.trim();
    try {
      await conversation.external(() => this.categoriesService.create(name));
      await ctx.reply(`"${name}" kategoriyasi yaratildi ✅`);
    } catch (e) {
      await ctx.reply("Kategoriya yaratishda xatolik yuz berdi (balki u allaqachon mavjuddir).");
    }
  }
}
