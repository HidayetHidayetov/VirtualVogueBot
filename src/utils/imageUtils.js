import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import https from 'node:https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Downloads a photo from Telegram and saves it locally
 */
export async function downloadPhoto(bot, fileId) {
  try {
    // Get file info
    const file = await bot.getFile(fileId);
    const filePath = file.file_path;

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'virtualvogue');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;
    const localPath = path.join(tempDir, `${fileId}.jpg`);

    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(localPath);
      
      https.get(fileUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: ${response.statusCode}`));
          return;
        }
        
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(localPath);
        });
      }).on('error', (err) => {
        fs.unlink(localPath, () => {}); // Delete file on error
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error downloading photo:', error);
    throw error;
  }
}

/**
 * Cleans up temporary image files
 */
export function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
}

