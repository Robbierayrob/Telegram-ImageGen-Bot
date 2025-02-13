require('dotenv').config();
const { Bot, InputFile, Keyboard, InlineKeyboard } = require("grammy");
const { limit } = require("@grammyjs/ratelimiter");
const crypto = require('crypto');
const userHistory = new Map();

// Helper function for formatted logging
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}
const path = require("path");
const fs = require('fs');
const Replicate = require("replicate");
const { writeFile } = require("node:fs/promises");

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// Store authenticated users in memory
const authenticatedUsers = new Set();

// Create a bot object
const bot = new Bot("7725251083:AAEvgb5ND4-ToeRbfjWusByGD4xtrP1c5fQ");

// Add rate limiting
bot.use(limit({
    timeFrame: 2000, // 2 seconds
    limit: 1
}));

// Add error handling
bot.catch((err) => {
    console.error(`Error in bot:`, err);
    if (err.ctx) {
        err.ctx.reply("An error occurred. Please try again later.");
    }
});

log("Bot initialized successfully");

// Create login keyboard
const loginKeyboard = new Keyboard()
    .text("Login")
    .resized();

// Handle /start command
bot.command("start", async (ctx) => {
    const userId = ctx.from.id;
    log(`/start command from user ${userId}`);
    await ctx.reply("Welcome! Please press the Login button to authenticate.", {
        reply_markup: loginKeyboard
    });
});

// Track image count for unique IDs
let imageCount = 0;

// Generate unique filename with ID, username, and date/time
function generateFilename(userId, username) {
    // Increment and format image ID
    const imageId = String(++imageCount).padStart(4, '0');
    
    // Get current date/time and format it for filename
    const now = new Date();
    const formattedDate = now.toISOString()
        .replace(/T/, '_')  // Replace T with underscore
        .replace(/\..+/, '') // Remove milliseconds
        .replace(/:/g, '-'); // Replace colons with dashes
    
    // Clean username for filename (remove special chars)
    const cleanUsername = (username || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
    
    return `${imageId}_${cleanUsername}_${formattedDate}.webp`;
}

// Handle photo messages for editing
bot.on(":photo", async (ctx) => {
    const userId = ctx.from.id;
    if (!authenticatedUsers.has(userId)) {
        return await ctx.reply("Please authenticate first.");
    }
    
    try {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const file = await ctx.getFile();
        const filePath = `images/edit_${Date.now()}.jpg`;
        await file.download(filePath);
        
        await ctx.reply("What modifications would you like to make to this image?");
    } catch (error) {
        log(`Error handling photo edit: ${error.message}`);
        await ctx.reply("Sorry, I couldn't process that image.");
    }
});

// Handle text messages
bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id;
    
    log(`Received message from user ${userId}: ${text}`);
    
    // Handle login
    if (text === "Login") {
        await ctx.reply("Please enter the password:");
        return;
    }

    // Check if user is trying to authenticate
    if (!authenticatedUsers.has(userId)) {
        if (text === process.env.BOT_PASSWORD) {
            authenticatedUsers.add(userId);
            log(`User ${userId} authenticated successfully`);
            return await ctx.reply("Authentication successful! Just type what you want to see and I'll generate it.");
        }
        log(`Unauthenticated access attempt from user ${userId}`);
        return await ctx.reply("Incorrect password. Please try again.");
    }
    
    if (authenticatedUsers.has(userId)) {
        try {
            // Use the entire message as prompt
            const prompt = text.trim();
            
            if (!prompt) {
                log(`Empty prompt from user ${ctx.from.id}`);
                return await ctx.reply("Please type a description of the image you want to create.\nExample: a futuristic cityscape at sunset");
            }
            
            // Just call handleImageGeneration - it will handle everything
            await handleImageGeneration(ctx, prompt);
        } catch (error) {
            log(`Error generating image for user ${ctx.from.id}: ${error.message}`);
            console.error(error.stack);
            await ctx.reply("Oops! Something went wrong while generating the image.");
        }
    } else if (authenticatedUsers.has(userId)) {
        // If authenticated but not using a command
        await ctx.reply("Type a description of the image you want to create.\nExample: a cute puppy playing in the grass");
    }
});

// Handle inline button actions
bot.on("callback_query:data", async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.callbackQuery.data;
    
    if (data.startsWith("regenerate_")) {
        const filename = data.split("_").slice(1).join('_');
        const history = userHistory.get(userId);
        const entry = history.find(e => path.basename(e.filename) === filename);
        
        if (entry) {
            await ctx.answerCallbackQuery("Regenerating image...");
            await ctx.reply(`Regenerating your image with prompt: "${entry.prompt}"...`);
            try {
                await handleImageGeneration(ctx, entry.prompt);
            } catch (error) {
                await ctx.reply("Failed to regenerate image. Please try again.");
                log(`Error regenerating image for user ${userId}: ${error.message}`);
            }
        } else {
            await ctx.answerCallbackQuery("Couldn't find image to regenerate");
        }
    }
    else if (data.startsWith("image_")) {
        const filename = data.split("_").slice(1).join('_');
        log(`Share button clicked for filename: ${filename} by user ${userId}`);
        
        const history = userHistory.get(userId) || [];
        if (history.length === 0) {
            log(`No history found for user ${userId}`);
            return await ctx.answerCallbackQuery("No image history found");
        }

        const entry = history.find(e => path.basename(e.filename) === filename);
        if (!entry) {
            log(`Could not find image entry for filename: ${filename}`);
            log(`User history entries: ${history.map(e => path.basename(e.filename)).join(', ')}`);
            return await ctx.answerCallbackQuery("Couldn't find image to share");
        }

        try {
            log(`Attempting to forward image from path: ${entry.path}`);
            await ctx.answerCallbackQuery("Forwarding image...");
            
            // Forward the original message containing the image
            await ctx.forwardMessage(ctx.chat.id, ctx.message.message_id);
            
            await ctx.answerCallbackQuery("Image forwarded successfully");
        } catch (error) {
            log(`Error forwarding image for user ${userId}: ${error.message}`);
            console.error(error.stack);
            await ctx.answerCallbackQuery("Failed to forward image");
        }
    }
});

// Add /logout command
bot.command("logout", async (ctx) => {
    const userId = ctx.from.id;
    if (authenticatedUsers.has(userId)) {
        authenticatedUsers.delete(userId);
        log(`User ${userId} logged out`);
        await ctx.reply("Logged out successfully. Press Login to authenticate again.", {
            reply_markup: loginKeyboard
        });
    } else {
        await ctx.reply("You're not logged in.");
    }
});

// Handle image generation logic
async function handleImageGeneration(ctx, prompt) {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name || 'user';
    
    log(`Starting image generation for user ${userId} with prompt: ${prompt}`);
    
    // Show typing indicator
    await ctx.api.sendChatAction(ctx.chat.id, "upload_photo");
    await ctx.reply("Generating your image...");
    
    try {
        // Generate image
        log(`Request sent to Replicate API for user ${userId}`);
        const output = await replicate.run("black-forest-labs/flux-schnell", {
            input: {
                prompt: prompt
            }
        });

        // Generate unique filename
        const filename = generateFilename(userId, username);
        const outputPath = path.join(__dirname, "images", filename);
        
        // Save the image permanently
        await writeFile(outputPath, output[0]);
        log(`Image saved successfully for user ${userId} at ${outputPath}`);
        
        // Get current date/time and format it
        const now = new Date();
        const formattedDate = now.toLocaleString('en-AU', {
            timeZone: 'Australia/Sydney',
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        // Store in history
        const historyEntry = {
            prompt,
            filename,
            path: outputPath,
            timestamp: new Date()
        };
        if (!userHistory.has(userId)) {
            userHistory.set(userId, []);
        }
        userHistory.get(userId).push(historyEntry);

        // Create inline keyboard with regenerate and share
        const basename = path.basename(filename);
        log(`Creating buttons for filename: ${basename}`);
        const inlineKeyboard = new InlineKeyboard()
            .text("🔄 Regenerate", `regenerate_${basename}`)
            .switchInline("📤 Share", `image_${basename}`);

        // Send the image to user
        await ctx.replyWithPhoto(new InputFile(outputPath), {
            caption: `Here's your generated image, ${username}! (${formattedDate})\nSaved as: ${filename}`,
            reply_markup: inlineKeyboard
        });
        log(`Image sent successfully to user ${userId} (${username})`);
    } catch (error) {
        log(`Error generating image for user ${userId}: ${error.message}`);
        console.error(error.stack);
        await ctx.reply("Oops! Something went wrong while generating the image.");
        throw error;
    }
}

// Start the bot
bot.start();
log("Bot started and ready to receive messages");
