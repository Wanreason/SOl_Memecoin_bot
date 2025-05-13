import os
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, CallbackQueryHandler, ContextTypes
from jupiter_trade import execute_trade, check_stop_loss_take_profit
from keep_alive import keep_alive
from jupiter_utils import get_hot_memecoins
from apscheduler.schedulers.asyncio import AsyncIOScheduler

BOT_TOKEN = os.getenv("BOT_TOKEN")

# Start command
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Welcome! Use /hot to see trending Solana memecoins.")

# /hot command to get trending memecoins
async def hot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    coins = get_hot_memecoins()
    if not coins:
        await update.message.reply_text("No hot memecoins found right now.")
        return

    message = "🔥 *Top Trending Solana Memecoins:*\n\n"
    for coin in coins:
        message += (
            f"*{coin['symbol']}* ({coin['name']})\n"
            f"Price: `${coin['price']:.6f}`\n"
            f"24h Volume: `${coin['volume24h']:,}`\n"
            f"Liquidity: `${coin['liquidity']:,}`\n"
            f"[Swap on Jupiter](https://jup.ag/swap/SOL-{coin['address']})\n\n"
        )

    await update.message.reply_text(message, parse_mode="Markdown")

# /trade command for auto-trading
async def auto_trade(update: Update, context: ContextTypes.DEFAULT_TYPE):
    token_address = context.args[0]  # Get token address from command arguments
    usdc_amount = float(context.args[1])  # Get USDC amount from command arguments
    price = float(context.args[2])  # Get price from command arguments

    # Execute the trade (real trade)
    result = await execute_trade(token_address, usdc_amount, "TokenSymbol", price)

    if result['success']:
        await update.message.reply_text(f"Successfully traded {usdc_amount} USDC for {result['token']}.")
    else:
        await update.message.reply_text(f"Trade failed: {result.get('error', 'Unknown error')}.")

# Scheduler to periodically monitor and alert
def start_scheduler(app):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(monitor_and_alert, 'interval', minutes=1, args=[app])
    scheduler.start()

# Monitor hot coins every minute
async def monitor_and_alert(app):
    coins = get_hot_memecoins()
    for coin in coins:
        if coin['volume24h'] > 10000 and coin['liquidity'] > 9000:
            message = (
                f"🔥 Hot trending token detected: {coin['name']} ({coin['symbol']})\n"
                f"Price: ${coin['price']:.6f}\n"
                f"Volume: ${coin['volume24h']:,}\n"
                f"Liquidity: ${coin['liquidity']:,}\n"
                f"Swap now: [Jupiter Swap Link](https://jup.ag/swap/SOL-{coin['address']})"
            )
            # Send the alert to the Telegram channel
            chat_id = os.getenv("CHAT_ID")
            await app.bot.send_message(chat_id, message)

# Main function
async def main():
    keep_alive()
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("hot", hot))
    app.add_handler(CommandHandler("trade", auto_trade))

    start_scheduler(app)

    print("Bot is running...")
    await app.run_polling()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
