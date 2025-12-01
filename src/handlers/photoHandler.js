import { processDressImage } from '../services/aiService.js';
import { downloadPhoto } from '../utils/imageUtils.js';

/**
 * Handles photo messages from users
 */
export async function handlePhoto(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Send processing message
    const processingMsg = await bot.sendMessage(
      chatId,
      '🔄 Processing your dress image... This may take a moment.',
      { reply_to_message_id: msg.message_id }
    );

    // Get the largest photo size
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;

    // Download the photo
    const photoPath = await downloadPhoto(bot, fileId);

    // Process the image with AI
    const resultImagePath = await processDressImage(photoPath);

    if (resultImagePath) {
      // Check if we're in test mode
      const isTestMode = process.env.TEST_MODE === 'true';
      const caption = isTestMode
        ? '🧪 TEST MODE: This is your original image. AI processing is disabled for testing.'
        : '✨ Here\'s your dress visualized on a virtual model!';

      // Send the processed image
      await bot.sendPhoto(chatId, resultImagePath, {
        caption: caption,
        reply_to_message_id: msg.message_id
      });

      // Delete processing message
      await bot.deleteMessage(chatId, processingMsg.message_id);
    } else {
      throw new Error('Failed to process image');
    }
  } catch (error) {
    console.error('Error processing photo:', error);

    let errorMessage = '❌ Sorry, I encountered an error while processing your image.';

    // Provide more specific error messages
    if (error.message?.includes('REPLICATE_API_TOKEN') || error.message?.includes('authentication')) {
      errorMessage = '❌ API authentication error. Please contact the bot administrator.';
      console.error('API Token Error:', error.message);
    } else if (error.message?.includes('All free AI models are currently unavailable') || error.message?.includes('All free')) {
      errorMessage = '🆓 All free AI models are currently unavailable. The Virtual Try-On and text-to-image models on Hugging Face are not responding. This could be temporary - please try again in a few minutes. The bot administrator can enable TEST_MODE for testing.';
      console.error('All Free Models Unavailable:', error.message);
    } else if (error.message?.includes('Hugging Face model endpoint not available') || error.message?.includes('410')) {
      errorMessage = '🆓 Free AI models are currently unavailable. The bot is trying to use free Hugging Face models, but they\'ve been removed. Please contact the administrator to set up a paid service or enable test mode.';
      console.error('Hugging Face Model Error:', error.message);
    } else if (error.message?.includes('Insufficient credit') || error.message?.includes('insufficient credit')) {
      errorMessage = '💳 All free models failed, and the paid service needs credits. The bot administrator needs to: 1) Fix free model setup, 2) Add credits to Replicate, or 3) Enable TEST_MODE for testing.';
      console.error('Credit Error:', error.message);
    } else if (error.message?.includes('timeout')) {
      errorMessage = '⏱️ Processing took too long. Please try again with a smaller image.';
    } else if (error.message?.includes('Invalid')) {
      errorMessage = '❌ Invalid configuration. Please contact the bot administrator.';
    } else if (error.message?.includes('No AI service configured')) {
      errorMessage = '⚙️ No AI service is configured. Please contact the bot administrator.';
    }

    await bot.sendMessage(
      chatId,
      errorMessage + '\n\nPlease try again with a clear photo of a dress.',
      { reply_to_message_id: msg.message_id }
    );
  }
}

