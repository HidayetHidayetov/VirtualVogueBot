import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleMessage } from './handlers/messageHandler.js';
import { handlePhoto } from './handlers/photoHandler.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

// Debug: Check if Replicate token is loaded (without exposing full token)
if (process.env.REPLICATE_API_TOKEN) {
  const tokenPreview = process.env.REPLICATE_API_TOKEN.substring(0, 10) + '...';
  console.log(`✅ Replicate API Token loaded: ${tokenPreview}`);
} else {
  console.warn('⚠️  WARNING: REPLICATE_API_TOKEN is not set in .env file');
}

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 VirtualVogue Studio bot is running...');

// Handle text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  // Skip if it's a photo (handled separately)
  if (msg.photo) {
    return;
  }

  await handleMessage(bot, msg);
});

// Handle photo messages
bot.on('photo', async (msg) => {
  await handlePhoto(bot, msg);
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

