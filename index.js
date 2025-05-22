import 'dotenv/config';
import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Welcome message
bot.start((ctx) => {
  ctx.reply(`👋 Welcome to Solana Hot Token Alert Bot!

Use:
/start - Get welcome message
/hot - 🔥 View trending Solana tokens
/info [token_address] - ℹ️ Token stats`);
});

// Trending tokens (mocked - will fetch real data)
bot.command('hot', async (ctx) => {
  try {
    const trending = await getTrendingTokens();
    ctx.reply(trending);
  } catch (error) {
    ctx.reply("❌ Error fetching hot tokens.");
  }
});

// Get token info by address
bot.command('info', async (ctx) => {
  const args = ctx.message.text.split(" ");
  const address = args[1];
  if (!address) {
    ctx.reply("❗ Usage: /info [token_address]");
    return;
  }
  try {
    const data = await getTokenInfo(address);
    ctx.reply(data);
  } catch (error) {
    ctx.reply("❌ Error fetching token info.");
  }
});

// Helper: Fetch top trending tokens (mock or from Birdeye/GeckoTerminal)
async function getTrendingTokens() {
  const res = await fetch("https://public-api.birdeye.so/public/tokenlist?sort_by=volume_24h&sort_type=desc&limit=5", {
    headers: { "X-API-KEY": "public" }
  });
  const json = await res.json();
  const tokens = json.data?.tokens || [];
  return tokens.map((t, i) => `${i + 1}. ${t.name} (${t.symbol})\n   💧 LP: $${formatNumber(t.liquidity.usd)} | 📊 24h Vol: $${formatNumber(t.volume_24h)}`).join("\n\n");
}

// Helper: Fetch token info by address
async function getTokenInfo(address) {
  const res = await fetch(`https://public-api.birdeye.so/public/token/${address}`, {
    headers: { "X-API-KEY": "public" }
  });
  const token = await res.json();
  const t = token.data;
  if (!t) return "❌ Token not found.";
  return `🔍 ${t.name} (${t.symbol})\n💧 Liquidity: $${formatNumber(t.liquidity.usd)}\n📊 Volume 24h: $${formatNumber(t.volume_24h)}\n👥 Holders: ${formatNumber(t.holder_count)}`;
}

// Helper: Format big numbers
function formatNumber(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

bot.launch();
console.log("🚀 Bot with live market alerts is running...");
