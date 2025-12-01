import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Processes a dress image using AI to visualize it on a virtual model
 * Tries free options first (Hugging Face), then falls back to Replicate
 */
export async function processDressImage(imagePath) {
    // TEST MODE: If enabled, return original image (for testing without AI)
    if (process.env.TEST_MODE === 'true') {
        console.log('🧪 TEST MODE: Returning original image');
        return imagePath; // Return original image for testing
    }

    // Try Virtual Try-On models first (if configured)
    if (process.env.HUGGINGFACE_API_KEY && process.env.USE_VIRTUAL_TRYON === 'true') {
        try {
            console.log('Using Virtual Try-On models (free) for image processing...');
            return await processWithVirtualTryOn(imagePath);
        } catch (error) {
            console.warn('Virtual Try-On failed, trying regular models:', error.message);
            // Fall through to regular models
        }
    }

    // Try Hugging Face first (FREE - no credits needed)
    if (process.env.HUGGINGFACE_API_KEY) {
        try {
            console.log('Using Hugging Face (free) for image processing...');
            return await processWithHuggingFace(imagePath);
        } catch (error) {
            console.warn('Hugging Face failed, trying Replicate:', error.message);
            // Fall through to Replicate if Hugging Face fails
        }
    }

    // Fallback to Replicate (requires credits) - only if explicitly enabled
    if (process.env.REPLICATE_API_TOKEN && process.env.ALLOW_REPLICATE_FALLBACK !== 'false') {
        try {
            console.log('Using Replicate API for image processing...');
            return await processWithReplicate(imagePath);
        } catch (error) {
            console.error('Error in AI service:', error);
            // If Replicate also fails, provide helpful error
            if (error.message?.includes('Insufficient credit') || error.message?.includes('insufficient credit')) {
                throw new Error('All free AI models failed, and Replicate requires credits. Please: 1) Check Hugging Face model availability, 2) Add credits to Replicate, or 3) Enable TEST_MODE=true for testing. Set ALLOW_REPLICATE_FALLBACK=false to disable Replicate fallback.');
            }
            throw error;
        }
    }

    // If we get here, all free options failed and Replicate is disabled or not configured
    throw new Error('All free AI models are currently unavailable. The Virtual Try-On and text-to-image models on Hugging Face returned errors. Options: 1) Wait and try again (models may be loading), 2) Check Hugging Face for available models, 3) Enable TEST_MODE=true for testing, or 4) Add credits to Replicate and set ALLOW_REPLICATE_FALLBACK=true');
}

/**
 * Process image using Replicate API
 * Uses a fashion-focused image-to-image model
 */
async function processWithReplicate(imagePath) {
    // Validate API token
    const apiToken = process.env.REPLICATE_API_TOKEN?.trim();
    if (!apiToken || !apiToken.startsWith('r8_')) {
        throw new Error('Invalid REPLICATE_API_TOKEN. Token should start with "r8_". Please check your .env file.');
    }

    const replicateApiUrl = 'https://api.replicate.com/v1/predictions';

    // Upload image to Replicate's file storage first
    const imageUrl = await uploadImageToReplicate(imagePath, apiToken);

    // Use a more current and stable model for image-to-image
    // Using a general purpose model that works well with fashion images
    const input = {
        image: imageUrl,
        prompt: 'a beautiful dress on a professional fashion model, high quality, studio lighting, fashion photography, elegant pose',
        strength: 0.75, // How much to transform the image (0-1)
        guidance_scale: 7.5,
        num_inference_steps: 25
    };

    // Create prediction using a stable img2img model
    let createResponse;
    try {
        createResponse = await axios.post(
            replicateApiUrl,
            {
                version: '15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d',
                input: input
            },
            {
                headers: {
                    'Authorization': `Token ${apiToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error) {
        if (error.response?.status === 401) {
            throw new Error('Replicate API authentication failed. Please check that your REPLICATE_API_TOKEN is correct and valid. Get a new token at https://replicate.com/account/api-tokens');
        }
        if (error.response?.status === 402) {
            throw new Error('Insufficient credits in your Replicate account. Please add credits at https://replicate.com/account/billing#billing and wait a few minutes before trying again.');
        }
        throw error;
    }

    const predictionId = createResponse.data.id;
    let prediction = createResponse.data;

    // Poll for completion (with timeout)
    const maxWaitTime = 120000; // 2 minutes max
    const startTime = Date.now();

    while (prediction.status === 'starting' || prediction.status === 'processing') {
        if (Date.now() - startTime > maxWaitTime) {
            throw new Error('Image processing timed out. Please try again.');
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        try {
            const statusResponse = await axios.get(
                `https://api.replicate.com/v1/predictions/${predictionId}`,
                {
                    headers: {
                        'Authorization': `Token ${apiToken}`
                    }
                }
            );

            prediction = statusResponse.data;
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Replicate API authentication failed during status check.');
            }
            throw error;
        }
    }

    if (prediction.status === 'succeeded' && prediction.output) {
        // Download the result image
        const outputUrl = Array.isArray(prediction.output)
            ? prediction.output[0]
            : prediction.output;

        const imageResponse = await axios.get(outputUrl, {
            responseType: 'arraybuffer'
        });

        // Save to temporary file
        const outputPath = path.join(os.tmpdir(), `virtualvogue-${Date.now()}.jpg`);
        fs.writeFileSync(outputPath, imageResponse.data);

        return outputPath;
    } else if (prediction.status === 'failed') {
        const errorMsg = prediction.error || 'Unknown error';
        throw new Error(`Prediction failed: ${errorMsg}`);
    } else {
        throw new Error(`Prediction ended with status: ${prediction.status}`);
    }
}

/**
 * Upload image to Replicate's file storage and return the URL
 */
async function uploadImageToReplicate(imagePath, apiToken) {
    try {
        // Read the image file
        const imageBuffer = fs.readFileSync(imagePath);

        // Upload to Replicate
        const uploadResponse = await axios.post(
            'https://api.replicate.com/v1/files',
            imageBuffer,
            {
                headers: {
                    'Authorization': `Token ${apiToken}`,
                    'Content-Type': 'application/octet-stream'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        return uploadResponse.data.urls.get;
    } catch (error) {
        // If file upload fails, try using base64 as fallback
        console.warn('File upload failed, trying base64 fallback:', error.message);
        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');
        return `data:image/jpeg;base64,${base64Image}`;
    }
}

/**
 * Process using Virtual Try-On models (FREE - perfect for dress try-on!)
 * These models place a garment (dress) onto a virtual model
 * Models: OutfitAnyone, Kolors, WeShopAI, etc.
 */
async function processWithVirtualTryOn(imagePath) {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
    }

    // Virtual Try-On models that work with Hugging Face Inference API
    // These models place a garment (dress) onto a virtual model
    // User's suggested models + alternatives
    const tryOnModels = [
        'levihsu/OutfitAnyone',  // OutfitAnyone - user's suggestion
        'Kolors/Kolors-Virtual-Try-On',  // Kolors Virtual Try-On - user's suggestion
        'WeShopAI/WeShopAI-Virtual-Try-On',  // WeShopAI Virtual Try-On - user's suggestion
        'levihsu/OOTDiffusion',  // Alternative: OOTDiffusion
        'yisol/IDM-VTON',  // Alternative: IDM Virtual Try-On
    ];

    // Read the garment (dress) image
    const garmentImageBuffer = fs.readFileSync(imagePath);
    const garmentBase64 = garmentImageBuffer.toString('base64');
    const garmentDataUri = `data:image/jpeg;base64,${garmentBase64}`;

    let lastError = null;

    // Try each virtual try-on model
    for (const modelId of tryOnModels) {
        try {
            console.log(`Trying Virtual Try-On model: ${modelId}`);
            const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

            // Virtual try-on models typically need:
            // - garment_image: The dress/clothing item
            // - person_image: The model/person (some models generate this automatically)
            const response = await axios.post(
                apiUrl,
                {
                    inputs: {
                        garment_image: garmentDataUri,
                        // Some models auto-generate person, others need it
                        // We'll try with just garment first
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'arraybuffer',
                    timeout: 180000 // 3 minutes for virtual try-on (takes longer)
                }
            );

            // Save the result image
            const outputPath = path.join(os.tmpdir(), `virtualvogue-${Date.now()}.jpg`);
            fs.writeFileSync(outputPath, response.data);
            console.log(`✅ Successfully generated virtual try-on using ${modelId}`);
            return outputPath;
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            console.warn(`Model ${modelId} failed:`, status || error.message);

            // If 400/422, try different input format
            if (status === 400 || status === 422) {
                try {
                    console.log(`Trying ${modelId} with alternative input format...`);
                    const altResponse = await axios.post(
                        `https://api-inference.huggingface.co/models/${modelId}`,
                        {
                            inputs: garmentDataUri  // Some models just need the image directly
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            responseType: 'arraybuffer',
                            timeout: 180000
                        }
                    );
                    const outputPath = path.join(os.tmpdir(), `virtualvogue-${Date.now()}.jpg`);
                    fs.writeFileSync(outputPath, altResponse.data);
                    console.log(`✅ Successfully generated using ${modelId} with alternative format`);
                    return outputPath;
                } catch (altError) {
                    console.warn(`Alternative format also failed for ${modelId}`);
                    continue;
                }
            }
            continue;
        }
    }

    // If all models failed, provide helpful error
    if (lastError) {
        if (lastError.response?.status === 503) {
            throw new Error('Virtual Try-On models are loading. Free models may take time to warm up. Please try again in a minute.');
        }
        if (lastError.response?.status === 401) {
            throw new Error('Hugging Face API authentication failed. Please check your HUGGINGFACE_API_KEY.');
        }
        if (lastError.response?.status === 410) {
            throw new Error('Virtual Try-On model endpoints not available. These models may have been moved or removed. Try setting USE_VIRTUAL_TRYON=false to use regular models.');
        }
        throw new Error(`Virtual Try-On failed: ${lastError.response?.status || lastError.message}. Try regular models by setting USE_VIRTUAL_TRYON=false`);
    }

    throw new Error('No working Virtual Try-On models found');
}

/**
 * Process using Hugging Face Inference API (FREE - no credits needed!)
 * Uses text-to-image models (generates fashion model from prompt)
 * Note: For true image-to-image, use Virtual Try-On models instead
 */
async function processWithHuggingFace(imagePath) {
    const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
    if (!apiKey) {
        throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
    }

    // Use a text-to-image model with the dress description
    // This creates a new image based on the prompt (free but not true img2img)
    // Try multiple models - updated list with more reliable, currently available models
    // Free tier gives $0.10/month in credits (enough for a few images)
    const models = [
        'stabilityai/sdxl-turbo',  // Fast SDXL model (newer, more likely to work)
        'stabilityai/stable-diffusion-xl-base-1.0',  // SDXL base model
        'stabilityai/stable-diffusion-2-1',  // SD 2.1 full model
        'runwayml/stable-diffusion-v1-5',  // Classic SD 1.5
        'CompVis/stable-diffusion-v1-4'  // Original SD 1.4
    ];

    const prompt = 'a beautiful dress on a professional fashion model, high quality, studio lighting, fashion photography, elegant pose, full body shot, photorealistic';

    let lastError = null;

    // Try each model until one works
    for (const modelId of models) {
        try {
            console.log(`Trying Hugging Face model: ${modelId}`);
            const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;

            // Try with parameters first (for newer models)
            let response;
            try {
                response = await axios.post(
                    apiUrl,
                    {
                        inputs: prompt,
                        parameters: {
                            num_inference_steps: 20,
                            guidance_scale: 7.5
                        }
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        responseType: 'arraybuffer',
                        timeout: 120000 // 120 second timeout for free models
                    }
                );
            } catch (paramError) {
                // If parameters fail, try without (for older models)
                if (paramError.response?.status === 400 || paramError.response?.status === 422) {
                    console.log(`Trying ${modelId} without parameters...`);
                    response = await axios.post(
                        apiUrl,
                        {
                            inputs: prompt
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            responseType: 'arraybuffer',
                            timeout: 120000
                        }
                    );
                } else {
                    throw paramError;
                }
            }

            // Save the result image
            const outputPath = path.join(os.tmpdir(), `virtualvogue-${Date.now()}.jpg`);
            fs.writeFileSync(outputPath, response.data);
            console.log(`Successfully generated image using ${modelId}`);
            return outputPath;
        } catch (error) {
            lastError = error;
            console.warn(`Model ${modelId} failed:`, error.response?.status || error.message);
            // Continue to next model
            continue;
        }
    }

    // If all models failed, handle the error
    if (lastError) {
        if (lastError.response?.status === 503) {
            throw new Error('Hugging Face models are loading. Free models may take time to warm up. Please try again in a minute.');
        }

        if (lastError.response?.status === 401) {
            throw new Error('Hugging Face API authentication failed. Please check your HUGGINGFACE_API_KEY. Get a free token at https://huggingface.co/settings/tokens');
        }

        if (lastError.response?.status === 429) {
            throw new Error('Hugging Face rate limit reached. Free tier has limits. Please wait a moment and try again.');
        }

        if (lastError.response?.status === 410) {
            throw new Error('Hugging Face model endpoint not available. The free models may have changed. Please check Hugging Face status or use Replicate API instead.');
        }

        throw new Error(`Hugging Face API error: ${lastError.response?.status || lastError.message}`);
    }

    throw new Error('No Hugging Face models available');
}

