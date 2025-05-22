import 'dotenv/config';
import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply(`👋 Welcome to Solana Hot Token Alert Bot!

Use:
/hot - 🔥 See trending Solana memecoins`);
});

bot.command('hot', async (ctx) => {
  const hotTokens = await getHotTokens();
  ctx.reply(hotTokens);
});

async function getHotTokens() {
  return `🔥 HOT TOKENS:
1. WEN - Volume: $1.2M
2. POPCAT - Volume: $800K
3. MEW - Volume: $600K

🚀 Type /info [token] to learn more`;
}

bot.launch();
console.log('🚀 Bot running...');
