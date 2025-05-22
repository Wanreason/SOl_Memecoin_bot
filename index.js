import 'dotenv/config';
import fetch from 'node-fetch';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

// In-memory cache for last checked tokens
let lastCheckTime = Date.now();
let lastTokenVolumes = {};

// Welcome message
bot.start((ctx) => {
  ctx.reply(`👋 Welcome to Solana Hot Token Alert Bot!

Use:
/start - Get welcome message
/hot - 🔥 View trending Solana tokens
/info [token_address] - ℹ️ Token stats`);
});

// Trending tokens command
bot.command('hot', async (ctx) => {
  try {
    const trending = await getTrendingTokens();
    ctx.reply(trending);
  } catch (error) {
    ctx.reply("❌ Error fetching hot tokens.");
  }
});

// Token info command
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

// Auto alert interval (every 2 minutes)
setInterval(async () => {
  try {
    const res = await fetch("https://public-api.birdeye.so/public/tokenlist?sort_by=volume_24h&sort_type=desc&limit=10", {
      headers: { "X-API-KEY": "public" }
    });
    const json = await res.json();
    const tokens = json.data?.tokens || [];

    for (const token of tokens) {
      const vol = Number(token.volume_24h);
      const prevVol = lastTokenVolumes[token.address] || 0;

      // Volume spike detection
      if (vol > prevVol * 2 && vol > 100000) {
        bot.telegram.sendMessage(
          process.env.ALERT_CHANNEL_ID || ctx.chat?.id,
          `🚀 Volume Spike Detected: ${token.name} (${token.symbol})\n24h Vol: $${formatNumber(vol)}\nLiquidity: $${formatNumber(token.liquidity.usd)}\nhttps://birdeye.so/token/${token.address}`
        );
      }

      // Scam/Rug detection (low LP or huge drop)
      if (token.liquidity.usd < 3000 || vol > 100000 && token.liquidity.usd < 1000) {
        bot.telegram.sendMessage(
          process.env.ALERT_CHANNEL_ID || ctx.chat?.id,
          `⚠️ Possible Rug Alert: ${token.name} (${token.symbol})\nLiquidity is dangerously low!\nLiquidity: $${formatNumber(token.liquidity.usd)}\nhttps://birdeye.so/token/${token.address}`
        );
      }

      lastTokenVolumes[token.address] = vol;
    }
  } catch (err) {
    console.error("Auto alert failed:", err);
  }
}, 2 * 60 * 1000);

// Trending tokens
async function getTrendingTokens() {
  const res = await fetch("https://public-api.birdeye.so/public/tokenlist?sort_by=volume_24h&sort_type=desc&limit=5", {
    headers: { "X-API-KEY": "public" }
  });
  const json = await res.json();
  const tokens = json.data?.tokens || [];
  return tokens.map((t, i) => `${i + 1}. ${t.name} (${t.symbol})\n   💧 LP: $${formatNumber(t.liquidity.usd)} | 📊 24h Vol: $${formatNumber(t.volume_24h)}\n   🔗 https://birdeye.so/token/${t.address}`).join("\n\n");
}

// Token info by address
async function getTokenInfo(address) {
  const res = await fetch(`https://public-api.birdeye.so/public/token/${address}`, {
    headers: { "X-API-KEY": "public" }
  });
  const token = await res.json();
  const t = token.data;
  if (!t) return "❌ Token not found.";
  return `🔍 ${t.name} (${t.symbol})\n💧 Liquidity: $${formatNumber(t.liquidity.usd)}\n📊 Volume 24h: $${formatNumber(t.volume_24h)}\n👥 Holders: ${formatNumber(t.holder_count)}\n🔗 https://birdeye.so/token/${address}`;
}

// Format numbers
function formatNumber(n) {
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

bot.launch();
console.log("🚀 Bot with real-time alerts and safety checks is running...");
