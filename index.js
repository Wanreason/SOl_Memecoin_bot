const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// In-memory cache to track alerts
const cache = {};

// Health check route for Render
app.get('/health', (req, res) => {
  res.send('Bot is running.');
});

app.listen(PORT, () => {
  console.log(`🌐 Server is listening on port ${PORT}`);
});

// --- Telegram Command Handlers ---
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 Welcome! I'll keep you updated on trending Solana tokens and send scam alerts.");
});

bot.onText(/\/hot/, async (msg) => {
  const chatId = msg.chat.id;
  const tokens = await getTrendingTokens();
  const message = formatTokens(tokens);
  bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// --- Auto Alert System ---
setInterval(async () => {
  const tokens = await getTrendingTokens();

  for (const token of tokens) {
    const key = `${token.symbol}_${token.liquidity}_${token.volume}`;
    if (cache[key]) continue;
    cache[key] = true;

    // Detect potential scams/rugs
    const isRug = token.liquidity < 3000 || (token.volume > 50000 && token.liquidity < 1000);
    const isSpike = token.volume > 100000 && token.volumeChange24h > 100; // hypothetical change check

    let alertMsg = `📈 *${token.name}* (${token.symbol})\n💧 LP: $${token.liquidity}\n📊 24h Volume: $${token.volume}\n🆔 ${token.tokenAddress}`;

    if (isRug) {
      alertMsg = '⚠️ *Potential Rug Detected!*\n' + alertMsg;
    } else if (isSpike) {
      alertMsg = '🚨 *Volume Spike!*\n' + alertMsg;
    } else {
      continue; // skip normal tokens
    }

    bot.sendMessage(ALERT_CHANNEL_ID || process.env.CHAT_ID, alertMsg, { parse_mode: 'Markdown' });
  }
}, 120000); // every 2 minutes

// --- Helper Functions ---
async function getTrendingTokens() {
  try {
    const res = await fetch('https://api.dexscreener.com/latest/dex/pairs/solana');
    const data = await res.json();
    return data.pairs
      .filter((pair) => pair.liquidity.usd > 3000 && pair.volume.h24 > 100000)
      .map((pair) => ({
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        liquidity: pair.liquidity.usd,
        volume: pair.volume.h24,
        tokenAddress: pair.url,
        volumeChange24h: pair.volumeChange ? pair.volumeChange.h24 || 0 : 0 // fallback
      }))
      .slice(0, 10);
  } catch (err) {
    console.error('Failed to fetch token data:', err);
    return [];
  }
}

function formatTokens(tokens) {
  return tokens.map((t, i) => `*${i + 1}. ${t.name}* (${t.symbol})\n💧 LP: $${t.liquidity} | 📊 Vol: $${t.volume}\n🔗 [View Token](${t.tokenAddress})`).join('\n\n');
}
