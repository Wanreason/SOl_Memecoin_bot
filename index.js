import 'dotenv/config';
import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

// /start command
bot.start((ctx) => {
  ctx.reply(`👋 Welcome to Solana Hot Token Alert Bot!

Use:
/hot - 🔥 See currently trending Solana memecoins
/info [token] - ℹ️ Get token details
`);
});

// /hot command - Shows mock trending tokens (we’ll upgrade this)
bot.command('hot', async (ctx) => {
  const hotTokens = await getHotTokens();
  ctx.reply(hotTokens);
});

// Simulated trending token info
async function getHotTokens() {
  return `🔥 HOT TOKENS:
1. WEN - Volume: $1.2M | Holders: 14K
2. POPCAT - Volume: $800K | Holders: 8.5K
3. MEW - Volume: $600K | Holders: 5.1K

🚀 Use /info [token] to get more data.`;
}

bot.launch();
console.log('🚀 Bot is live...');
