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

// Generate unique filename with timestamp and user ID
function generateFilename(userId) {
    const timestamp = Date.now();
    return `generated_${userId}_${timestamp}.webp`;
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
            return await ctx.reply("Authentication successful! You can now use /generate");
        }
        log(`Unauthenticated access attempt from user ${userId}`);
        return await ctx.reply("Incorrect password. Please try again.");
    }
    
    if (text.startsWith("/generate")) {
        log(`Generate command received from user ${ctx.from.id}`);
        try {
            // Extract prompt from message
            const prompt = text.replace("/generate", "").trim();
            
            if (!prompt) {
                log(`Empty prompt from user ${ctx.from.id}`);
                return await ctx.reply("Please type something after /generate to describe the image you want to create.\nExample: /generate a futuristic cityscape at sunset");
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

            // Generate unique filename
            const filename = generateFilename(ctx.from.id);
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
            
            // Get username or fallback to "user"
            const username = ctx.from.username || ctx.from.first_name || 'user';
            
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
        await ctx.reply("Please use the /generate command followed by your image description.\nExample: /generate a cute puppy playing in the grass");
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
