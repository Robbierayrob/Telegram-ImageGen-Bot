require('dotenv').config();
const { Bot, InputFile, Keyboard } = require("grammy");

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
            
            log(`Starting image generation for user ${ctx.from.id} with prompt: ${prompt}`);

            // Generate image
            await ctx.reply("Generating your image...");
            log(`Request sent to Replicate API for user ${ctx.from.id}`);
            const output = await replicate.run("black-forest-labs/flux-schnell", {
                input: {
                    prompt: prompt
                }
            });

            // Generate unique filename with username
            const username = ctx.from.username || ctx.from.first_name || 'user';
            const filename = generateFilename(ctx.from.id, username);
            const outputPath = path.join(__dirname, "images", filename);
            
            // Save the image permanently
            await writeFile(outputPath, output[0]);
            log(`Image saved successfully for user ${ctx.from.id} at ${outputPath}`);
            
            // Get current date/time and format it
            const now = new Date();
            const formattedDate = now.toLocaleString('en-AU', {
                timeZone: 'Australia/Sydney',
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            
            // Send the image to user
            await ctx.replyWithPhoto(new InputFile(outputPath));
            await ctx.reply(`Here's your generated image, ${username}! (${formattedDate})\nSaved as: ${filename}`);
            log(`Image sent successfully to user ${ctx.from.id} (${username})`);
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

// Start the bot
bot.start();
log("Bot started and ready to receive messages");
