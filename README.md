# VirtualVogue Studio

A Telegram bot that uses AI to visualize dresses on virtual models. Send a photo of a dress, and the bot will transform it to show how it looks on a virtual model.

## Features

- 📸 Receive dress photos from users via Telegram
- 🤖 AI-powered image transformation using Replicate API
- ✨ Generate realistic visualizations of dresses on virtual models
- 🚀 Easy to set up and deploy

## Prerequisites

- Node.js 18+ installed
- A Telegram Bot Token (get one from [@BotFather](https://t.me/botfather))
- A Replicate API Token (free tier available at [replicate.com](https://replicate.com))

## Setup Instructions

### 1. Clone or Download the Project

```bash
cd VirtualVogueStudio
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here  # FREE option
# OR
REPLICATE_API_TOKEN=your_replicate_api_token_here  # Requires credits
```

### 4. Get Your Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token and add it to your `.env` file

### 5. Get Your AI API Token (Choose ONE)

#### Option A: Hugging Face (FREE - Recommended for Testing) ⭐

1. Sign up at [huggingface.co](https://huggingface.co) (completely free)
2. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token (read access is enough)
4. Copy the token and add it to your `.env` file as `HUGGINGFACE_API_KEY`

**Free Tier Details:**
- **$0.10/month in free credits** (enough for ~3-5 images depending on model)
- Perfect for testing and development
- No credit card required
- Rate limits apply (but generous for testing)

**Virtual Try-On Models (Recommended for Dress Try-On!):**
For virtual try-on functionality, you can use specialized models:
- **OutfitAnyone** - Places garments on virtual models
- **Kolors Virtual Try-On** - Fashion-focused try-on
- **WeShopAI Virtual Try-On** - E-commerce focused

To enable virtual try-on models, add to your `.env`:
```
USE_VIRTUAL_TRYON=true
```

The bot will automatically try these models first if enabled!

#### Option B: Replicate API (Requires Credits)

1. Sign up at [replicate.com](https://replicate.com)
2. Go to your account settings and create an API token
3. Add credits to your account (minimum $5-10)
4. Copy the token and add it to your `.env` file as `REPLICATE_API_TOKEN`

The bot will automatically use Hugging Face if available, or fall back to Replicate.

### 6. Run the Bot

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Project Structure

```
VirtualVogueStudio/
├── src/
│   ├── bot.js                 # Main bot entry point
│   ├── handlers/
│   │   ├── messageHandler.js  # Handles text messages
│   │   └── photoHandler.js    # Handles photo messages
│   ├── services/
│   │   └── aiService.js       # AI image processing service
│   └── utils/
│       └── imageUtils.js      # Image download and utility functions
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## How It Works

1. User sends a photo of a dress to the Telegram bot
2. Bot downloads the photo from Telegram servers
3. Photo is sent to Replicate API for AI processing
4. AI transforms the image to show the dress on a virtual model
5. Bot sends the transformed image back to the user

## Customization

### Using Different AI Models

You can modify the model in `src/services/aiService.js` to use different Replicate models. Some options:

- Fashion-specific models
- Portrait generation models
- Style transfer models

### Adjusting Image Processing Parameters

In `src/services/aiService.js`, you can adjust:

- `strength`: How much to transform the image (0-1)
- `guidance_scale`: How closely to follow the prompt
- `num_inference_steps`: Quality vs speed tradeoff

## Troubleshooting

### Bot not responding

- Check that your `TELEGRAM_BOT_TOKEN` is correct
- Ensure the bot is running (`npm start`)
- Check console for error messages

### Image processing fails

- Verify your `REPLICATE_API_TOKEN` is valid
- Check your Replicate account has available credits
- Ensure the image is a valid photo format (JPEG, PNG)

### Rate limiting

- Replicate free tier has rate limits
- Consider implementing request queuing for production use
- Monitor your API usage on Replicate dashboard

## Deployment

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start src/bot.js --name virtualvogue
pm2 save
pm2 startup
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## Author

**Hidayet Hidayetov**
- Full Stack Web Developer
- Website: [hidayetov.com](https://hidayetov.com)
- GitHub: [@HidayetHidayetov](https://github.com/HidayetHidayetov)

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

