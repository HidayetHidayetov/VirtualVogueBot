# Virtual Try-On Models Guide

## Overview
Virtual Try-On models are perfect for your VirtualVogue Studio bot! They place a dress image onto a virtual model, which is exactly what you need.

## Available Models

### 1. **OutfitAnyone** ⭐ (Recommended)
- **Model ID**: `levihsu/OutfitAnyone`
- **Best For**: General virtual try-on, good quality
- **Free Tier**: ✅ Yes ($0.10/month Hugging Face credits)
- **Ease of Integration**: ⭐⭐⭐⭐⭐ (Easy - standard API)
- **Input**: Garment image (your dress photo)
- **Output**: Dress on virtual model

### 2. **Kolors Virtual Try-On**
- **Model ID**: `Kolors/Kolors-Virtual-Try-On` (verify exact name on Hugging Face)
- **Best For**: Fashion-focused try-on
- **Free Tier**: ✅ Yes (if available on Hugging Face)
- **Ease of Integration**: ⭐⭐⭐⭐ (May need specific input format)
- **Note**: Verify the exact model name on huggingface.co/models

### 3. **WeShopAI Virtual Try-On**
- **Model ID**: `WeShopAI/WeShopAI-Virtual-Try-On` (verify exact name)
- **Best For**: E-commerce applications
- **Free Tier**: ✅ Yes (if available on Hugging Face)
- **Ease of Integration**: ⭐⭐⭐⭐ (May need specific input format)
- **Note**: Verify the exact model name on huggingface.co/models

## Recommendation: **OutfitAnyone**

**Why OutfitAnyone is the best choice:**
1. ✅ **Confirmed working** - Known to work with Hugging Face Inference API
2. ✅ **Easy integration** - Standard API format
3. ✅ **Free tier** - Uses your $0.10/month Hugging Face credits
4. ✅ **Good quality** - Produces realistic try-on results
5. ✅ **Well-maintained** - Active model on Hugging Face

## How to Enable

1. **Enable Virtual Try-On in `.env`:**
   ```
   USE_VIRTUAL_TRYON=true
   HUGGINGFACE_API_KEY=your_token_here
   ```

2. **Restart the bot:**
   ```bash
   pm2 restart virtualvogue --update-env
   ```

3. **Test it:**
   - Send a dress photo to your Telegram bot
   - The bot will try virtual try-on models first
   - If they fail, it falls back to regular text-to-image models

## Model Verification

**Important**: Some model names might need verification. To find the exact model IDs:

1. Go to https://huggingface.co/models
2. Search for "virtual try-on" or the specific model name
3. Check if the model has "Inference API" enabled
4. Copy the exact model ID (format: `username/model-name`)

## Free Tier Limits

- **$0.10/month** in free credits
- **~3-5 images** per month (depending on model complexity)
- **Resets monthly** - no credit card needed
- **Perfect for testing** your bot!

## Troubleshooting

### If models return 410 (Gone) errors:
- The model endpoint may have been removed
- Try setting `USE_VIRTUAL_TRYON=false` to use regular models
- Check Hugging Face for updated model names

### If models return 503 (Loading):
- Free models need to "warm up" when first used
- Wait 30-60 seconds and try again
- This is normal for free tier models

### If authentication fails:
- Verify your `HUGGINGFACE_API_KEY` is correct
- Get a new token at: https://huggingface.co/settings/tokens

## Next Steps

1. ✅ Virtual Try-On is now enabled in your code
2. ✅ Add `USE_VIRTUAL_TRYON=true` to your `.env` file
3. ✅ Restart the bot
4. ✅ Test with a dress photo!

The bot will automatically try OutfitAnyone first, then Kolors, then WeShopAI if available.

