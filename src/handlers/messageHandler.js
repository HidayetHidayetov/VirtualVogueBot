/**
 * Handles text messages from users
 */
export async function handleMessage(bot, msg) {
    const chatId = msg.chat.id;
    const messageText = msg.text?.toLowerCase().trim();

    if (!messageText) {
        return;
    }

    // Handle commands
    if (messageText.startsWith('/')) {
        switch (messageText) {
            case '/start':
            case '/help':
                await bot.sendMessage(chatId, `
👗 Welcome to VirtualVogue Studio!

I can help you visualize how a dress would look on a virtual model. Here's how to use me:

📸 Send me a photo of a dress
⏳ Wait while I process it with AI
✨ Receive the transformed image showing the dress on a virtual model

Commands:
/start - Show this welcome message
/help - Show help information

Just send me a photo of a dress to get started!
        `, { parse_mode: 'Markdown' });
                break;

            default:
                await bot.sendMessage(chatId, 'I don\'t understand that command. Send me a photo of a dress to get started! 📸');
        }
    } else {
        // Handle regular text messages
        await bot.sendMessage(chatId, 'Please send me a photo of a dress to visualize it on a virtual model! 📸');
    }
}

